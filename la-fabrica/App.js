import { StatusBar } from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {

  const [beacon_rssi, setBeaconRssi] = useState(0)

  useEffect(() => {
    const find_beacon = setInterval(() => {
      console.log("I am lokking for you")
    }, 50000);

    return clearInterval(find_beacon)
  })

  return (
    <View style={styles.container}>
      <Text style={styles.main_text}>La fábrica App</Text>
      <Text style={styles.beacon_rssi}>{beacon_rssi} dBm</Text>
      <StatusBar style="auto" />
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
