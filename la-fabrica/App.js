import { StatusBar } from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, Button, View, PermissionsAndroid, NativeModules, NativeEventEmitter, } from 'react-native';
import BleManager from 'react-native-ble-manager';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BEACON_MAC = ""

export default function App() {

  const [bluetooth_started, setBluetoothStarted] = useState(false)
  const [beacon_rssi, setBeaconRssi] = useState(0)

  useEffect(() => {
    if (!bluetooth_started) {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
      .then((result) => {
        if (result) {
          console.log("User accept ACCESS_FINE_LOCATION");
          return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
        } else {
          console.log("User refuse ACCESS_FINE_LOCATION");
        }
      })
      .then((result) => {
        if (result) {
          console.log("User accept BLUETOOTH_CONNECT");
          return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
        } else {
          console.log("User refuse BLUETOOTH_CONNECT");
        }
      })
      .then((result) => {
        if (result) {
          console.log("User accept BLUETOOTH_SCAN");
          return BleManager.start({ showAlert: false })
        } else {
          console.log("User refuse BLUETOOTH_SCAN");
        }
      })  
      .then(() => {
        console.log("Module initialized");
        bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral)
        setBluetoothStarted(true)
      });   
    }
  })

  useEffect(() => {
    if (bluetooth_started) {
      var find_beacon = setInterval(() => {
        console.log("I am lokking for you")
        BleManager.scan([], 1, false)
        .then(() => {
          console.log("Done scanning")
        })
      }, 10000);
    }
    
    return () => clearInterval(find_beacon)
  }, [bluetooth_started])

  const handleDiscoverPeripheral = (peripheral) => {
    if (peripheral.id == BEACON_MAC) {
      console.log('Beacon RSSI', peripheral.rssi);
      if (beacon_rssi !== 0) {
        rssi = (peripheral.rssi + beacon_rssi)/2
        rssi = math.round(rssi)
      } else {
        rssi = peripheral.rssi
      }
      setBeaconRssi(rssi)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.main_text}>La fábrica App</Text>
      <Text style={styles.beacon_rssi}>{beacon_rssi} dBm</Text>
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
