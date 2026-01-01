// Smart Guardian - React Native Uygulaması (Expo + TypeScript)

import * as Linking from 'expo-linking';
import type { LocationObjectCoords } from 'expo-location';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Accelerometer, Gyroscope, LightSensor } from 'expo-sensors';
import * as SMS from 'expo-sms';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  const [location, setLocation] = useState<LocationObjectCoords | null>(null);
  const [smsText, setSmsText] = useState('Acil durum! Lütfen yardım edin.');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accData, setAccData] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [lightData, setLightData] = useState<{ illuminance: number }>({ illuminance: 0 });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum izni reddedildi');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();

    Accelerometer.addListener(data => setAccData(data));
    Gyroscope.addListener(data => setGyroData(data));
    LightSensor.addListener(data => setLightData(data));

    return () => {
      Accelerometer.removeAllListeners();
      Gyroscope.removeAllListeners();
      LightSensor.removeAllListeners();
    };
  }, []);

  const sendSMS = async () => {
    if (await SMS.isAvailableAsync()) {
      const message = `${smsText}\nKonum: ${location?.latitude}, ${location?.longitude}`;
      await SMS.sendSMSAsync([phoneNumber], message);
    } else {
      Alert.alert('SMS gönderilemiyor');
    }
  };

  const makeCall = () => {
    if (phoneNumber) Linking.openURL(`tel:${phoneNumber}`);
  };

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Acil Durum!",
        body: "Konum ve sensör bilgileri gönderildi."
      },
      trigger: null,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Smart Guardian</Text>
      <TextInput placeholder="Telefon Numarası" value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} keyboardType="phone-pad" />
      <TextInput placeholder="Mesaj" value={smsText} onChangeText={setSmsText} style={styles.input} multiline />

      <Button title="SMS Gönder" onPress={sendSMS} />
      <Button title="Ara" onPress={makeCall} />
      <Button title="Bildirim Gönder" onPress={sendNotification} />

      {location && (
        <MapView style={styles.map} initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}>
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="Mevcut Konum" />
        </MapView>
      )}

      <Text style={styles.sensorTitle}>Sensör Verileri</Text>
      <Text>Accelerometer: x={accData.x.toFixed(2)} y={accData.y.toFixed(2)} z={accData.z.toFixed(2)}</Text>
      <Text>Gyroscope: x={gyroData.x.toFixed(2)} y={gyroData.y.toFixed(2)} z={gyroData.z.toFixed(2)}</Text>
      <Text>Light: {lightData.illuminance}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', marginVertical: 10, padding: 10, borderRadius: 8 },
  map: { width: '100%', height: 200, marginVertical: 20 },
  sensorTitle: { fontSize: 18, marginTop: 20, fontWeight: 'bold' }
});