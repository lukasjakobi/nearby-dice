package io.jakobi.nearbydice.nearby

import android.bluetooth.BluetoothManager
import android.content.Context
import android.location.LocationManager
import android.os.Build
import androidx.core.location.LocationManagerCompat
import com.google.android.gms.nearby.Nearby
import com.google.android.gms.nearby.connection.AdvertisingOptions
import com.google.android.gms.nearby.connection.ConnectionInfo
import com.google.android.gms.nearby.connection.ConnectionLifecycleCallback
import com.google.android.gms.nearby.connection.ConnectionResolution
import com.google.android.gms.nearby.connection.ConnectionsClient
import com.google.android.gms.nearby.connection.ConnectionsStatusCodes
import com.google.android.gms.nearby.connection.DiscoveredEndpointInfo
import com.google.android.gms.nearby.connection.DiscoveryOptions
import com.google.android.gms.nearby.connection.EndpointDiscoveryCallback
import com.google.android.gms.nearby.connection.Payload
import com.google.android.gms.nearby.connection.PayloadCallback
import com.google.android.gms.nearby.connection.PayloadTransferUpdate
import com.google.android.gms.nearby.connection.Strategy
import com.google.android.gms.common.api.ApiException
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Thin bridge over Google Nearby Connections with the P2P_STAR strategy.
 * Connections are accepted on both sides automatically; the JS session layer
 * compares the auth token itself (HELLO). Payloads are UTF-8 strings.
 */
class NearbyConnectionsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val client: ConnectionsClient by lazy { Nearby.getConnectionsClient(context) }

  /** Outgoing connection requests waiting for their result. */
  private val pendingConnections = mutableMapOf<String, Promise>()
  private val authTokens = mutableMapOf<String, String>()
  private val incoming = mutableSetOf<String>()

  override fun definition() = ModuleDefinition {
    Name("NearbyConnections")

    Events("onEndpointFound", "onEndpointLost", "onConnected", "onDisconnected", "onPayload")

    AsyncFunction("startAdvertising") { serviceId: String, endpointName: String, promise: Promise ->
      val options = AdvertisingOptions.Builder().setStrategy(Strategy.P2P_STAR).build()
      client.startAdvertising(endpointName, serviceId, lifecycle, options)
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { error -> resolveIfAlready(error, ConnectionsStatusCodes.STATUS_ALREADY_ADVERTISING, promise) }
    }

    AsyncFunction("stopAdvertising") {
      client.stopAdvertising()
    }

    AsyncFunction("startDiscovery") { serviceId: String, promise: Promise ->
      val options = DiscoveryOptions.Builder().setStrategy(Strategy.P2P_STAR).build()
      client.startDiscovery(serviceId, discovery, options)
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { error -> resolveIfAlready(error, ConnectionsStatusCodes.STATUS_ALREADY_DISCOVERING, promise) }
    }

    AsyncFunction("stopDiscovery") {
      client.stopDiscovery()
    }

    AsyncFunction("requestConnection") { endpointId: String, localName: String, promise: Promise ->
      pendingConnections[endpointId] = promise
      client.requestConnection(localName, endpointId, lifecycle)
        .addOnFailureListener { error ->
          pendingConnections.remove(endpointId)?.reject(CodedException("CONNECTION_FAILED", error.message, error))
        }
    }

    AsyncFunction("sendPayload") { endpointId: String, data: String, promise: Promise ->
      client.sendPayload(endpointId, Payload.fromBytes(data.toByteArray(Charsets.UTF_8)))
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { error -> promise.reject(CodedException("SEND_FAILED", error.message, error)) }
    }

    AsyncFunction("disconnect") { endpointId: String ->
      client.disconnectFromEndpoint(endpointId)
      forget(endpointId)
    }

    AsyncFunction("stopAllEndpoints") {
      client.stopAllEndpoints()
      // Rejects every pending connection request instead of leaving its promise unsettled.
      (pendingConnections.keys + authTokens.keys).forEach { forget(it) }
    }

    AsyncFunction("isBluetoothEnabled") {
      context.getSystemService(BluetoothManager::class.java)?.adapter?.isEnabled == true
    }

    AsyncFunction("isLocationEnabled") {
      val manager = context.getSystemService(LocationManager::class.java)
      manager != null && LocationManagerCompat.isLocationEnabled(manager)
    }

    // Runtime permissions through Expo's permission manager (ActivityCompat underneath).
    // Resolves with { status, granted, canAskAgain, expires }.
    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, *runtimePermissions())
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, *runtimePermissions())
    }

    OnDestroy {
      client.stopAllEndpoints()
      client.stopAdvertising()
      client.stopDiscovery()
    }
  }

  /** The dangerous permissions Nearby needs on this Android version (matches the manifest). */
  private fun runtimePermissions(): Array<String> = nearbyRuntimePermissions(Build.VERSION.SDK_INT)

  private fun resolveIfAlready(error: Exception, alreadyCode: Int, promise: Promise) {
    if (error is ApiException && error.statusCode == alreadyCode) {
      promise.resolve(null)
    } else {
      promise.reject(CodedException("NEARBY_FAILED", error.message, error))
    }
  }

  private fun forget(endpointId: String) {
    authTokens.remove(endpointId)
    incoming.remove(endpointId)
    pendingConnections.remove(endpointId)?.reject(CodedException("DISCONNECTED", "Disconnected", null))
  }

  private val lifecycle = object : ConnectionLifecycleCallback() {
    override fun onConnectionInitiated(endpointId: String, info: ConnectionInfo) {
      authTokens[endpointId] = info.authenticationDigits
      if (info.isIncomingConnection) incoming.add(endpointId)
      client.acceptConnection(endpointId, payloads)
    }

    override fun onConnectionResult(endpointId: String, result: ConnectionResolution) {
      val pending = pendingConnections.remove(endpointId)
      if (result.status.statusCode != ConnectionsStatusCodes.STATUS_OK) {
        pending?.reject(CodedException("CONNECTION_REJECTED", result.status.statusMessage, null))
        forget(endpointId)
        return
      }
      val token = authTokens[endpointId] ?: ""
      pending?.resolve(mapOf("authToken" to token))
      sendEvent(
        "onConnected",
        mapOf("endpointId" to endpointId, "authToken" to token, "incoming" to incoming.contains(endpointId))
      )
    }

    override fun onDisconnected(endpointId: String) {
      forget(endpointId)
      sendEvent("onDisconnected", mapOf("endpointId" to endpointId))
    }
  }

  private val payloads = object : PayloadCallback() {
    override fun onPayloadReceived(endpointId: String, payload: Payload) {
      val bytes = payload.asBytes() ?: return
      sendEvent("onPayload", mapOf("endpointId" to endpointId, "data" to String(bytes, Charsets.UTF_8)))
    }

    override fun onPayloadTransferUpdate(endpointId: String, update: PayloadTransferUpdate) = Unit
  }

  private val discovery = object : EndpointDiscoveryCallback() {
    override fun onEndpointFound(endpointId: String, info: DiscoveredEndpointInfo) {
      sendEvent("onEndpointFound", mapOf("endpointId" to endpointId, "endpointName" to info.endpointName))
    }

    override fun onEndpointLost(endpointId: String) {
      sendEvent("onEndpointLost", mapOf("endpointId" to endpointId))
    }
  }

}
