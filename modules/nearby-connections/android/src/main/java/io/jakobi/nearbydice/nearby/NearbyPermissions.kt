package io.jakobi.nearbydice.nearby

import android.Manifest
import android.os.Build

/** Play services can require location beyond API 31; request coarse and fine together. */
internal fun nearbyRuntimePermissions(sdk: Int): Array<String> = buildList {
  add(Manifest.permission.ACCESS_COARSE_LOCATION)
  if (sdk >= Build.VERSION_CODES.Q) add(Manifest.permission.ACCESS_FINE_LOCATION)
  if (sdk >= Build.VERSION_CODES.S) {
    add(Manifest.permission.BLUETOOTH_SCAN)
    add(Manifest.permission.BLUETOOTH_ADVERTISE)
    add(Manifest.permission.BLUETOOTH_CONNECT)
  }
  if (sdk >= Build.VERSION_CODES.TIRAMISU) add(Manifest.permission.NEARBY_WIFI_DEVICES)
  if (sdk >= 37) add("android.permission.ACCESS_LOCAL_NETWORK")
}.toTypedArray()
