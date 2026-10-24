package io.jakobi.nearbydice.nearby

import android.Manifest
import org.junit.Assert.assertEquals
import org.junit.Test

class NearbyPermissionsTest {
  @Test
  fun runtimePermissionsMatchEverySupportedAndroidRange() {
    val coarse = setOf(Manifest.permission.ACCESS_COARSE_LOCATION)
    val location = coarse + Manifest.permission.ACCESS_FINE_LOCATION
    val bluetooth = setOf(
      Manifest.permission.BLUETOOTH_SCAN,
      Manifest.permission.BLUETOOTH_ADVERTISE,
      Manifest.permission.BLUETOOTH_CONNECT,
    )
    val wifi = setOf(Manifest.permission.NEARBY_WIFI_DEVICES)
    for (sdk in 24..38) {
      val expected = when {
        sdk < 29 -> coarse
        sdk < 31 -> location
        sdk < 33 -> location + bluetooth
        sdk < 37 -> location + bluetooth + wifi
        else -> location + bluetooth + wifi + "android.permission.ACCESS_LOCAL_NETWORK"
      }
      assertEquals("API $sdk", expected, nearbyRuntimePermissions(sdk).toSet())
    }
  }
}
