import { StatusBar } from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, Button, View, PermissionsAndroid, NativeModules, NativeEventEmitter } from 'react-native';
import BleManager from 'react-native-ble-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

var measured_rssi = []
var at_home = false
const rssi_thershold = -90

export default function App() {

  const [bluetooth_started, setBluetoothStarted] = useState(false)
  const [beacon_rssi, setBeaconRssi] = useState(0)

  useEffect(() => {
    if (!bluetooth_started) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
      .then((result) => {
        if (result) {
          return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
        } else {
          console.log("User refuse ACCESS_FINE_LOCATION");
        }
      })
      .then((result) => {
        if (result) {
          return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
        } else {
          console.log("User refuse BLUETOOTH_CONNECT");
        }
      })
      .then((result) => {
        if (result) {
          return BleManager.start({ showAlert: false })
        } else {
          console.log("User refuse BLUETOOTH_SCAN");
        }
      })  
      .then(() => {
        bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)
        bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan)
        setBluetoothStarted(true)
      });   
    }

    return (() => {
      bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerStopScan' );
    })
  }, [])

  useEffect(() => {
    if (bluetooth_started) {
      var find_beacon = setInterval(() => {
        measured_rssi = []
        BleManager.scan([], 1, false)
      }, 10000);
    }
    
    return () => clearInterval(find_beacon)
  }, [bluetooth_started])

  const handleDiscoverPeripheral = async (peripheral) => {
    const beacon_mac = await AsyncStorage.getItem("beacon_mac")
    if (peripheral.id == beacon_mac) {
      measured_rssi.push(peripheral.rssi)
      
    }
  }

  const handleStopScan = async () => {
    var rssi = 0
    for ( var i = 0; i < measured_rssi.length; i ++) {
      if (rssi !== 0) {
        rssi = (measured_rssi[i] + rssi)/2
        rssi = Math.round(rssi)
      } else {
        rssi = measured_rssi[i]
      }
    }
    setBeaconRssi(rssi)

    var at_home_signal = rssi > rssi_thershold

    if(at_home_signal !== at_home) {
      fetch("https://" + await AsyncStorage.getItem("homeware_domain") + "/api/status/update/", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + await AsyncStorage.getItem("homeware_token")
        },
        body: JSON.stringify({
          "id": "scene_at_home",
          "param": "deactivate",
          "value": !at_home_signal
        })
      })
      .then((response) => response.json())
      .then((json) => {
        at_home = at_home_signal
      })
      .catch((error) => {
        console.error(error);
      });
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.main_text}>La fábrica App</Text>
      <Text style={[styles.beacon_rssi,{color: beacon_rssi > rssi_thershold ? "green" : "red"}]}>{beacon_rssi} dBm</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  main_text: {
    fontSize: 25,
  },
  beacon_rssi: {
    fontSize: 40,
  },
});
