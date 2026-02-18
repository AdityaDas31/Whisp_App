import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const myStatus = {
  name: "My Status",
  time: "Tap to add status update",
  image: "https://i.pravatar.cc/150?img=1",
};

const recentStatus = [
  {
    id: "1",
    name: "Rahul",
    time: "10 minutes ago",
    image: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: "2",
    name: "Ankit",
    time: "25 minutes ago",
    image: "https://i.pravatar.cc/150?img=3",
  },
];

const viewedStatus = [
  {
    id: "3",
    name: "Priya",
    time: "Yesterday, 8:45 PM",
    image: "https://i.pravatar.cc/150?img=4",
  },
];
import Svg, { Path } from "react-native-svg";

const CurvyRing = ({ uri, seen }) => {
  const size = 90;              // overall container
  const center = size / 2;
  const baseRadius = 36;        // circle size
  const waveAmplitude = 6;      // how much wave moves
  const waveCount = 7;          // 🔥 less waves = cleaner look
  const strokeWidth = 3;

  const createWavyCircle = () => {
    let path = "";
    const steps = 360;

    for (let i = 0; i <= steps; i++) {
      const angle = (i * Math.PI * 2) / steps;

      const wave = Math.sin(angle * waveCount) * waveAmplitude;
      const r = baseRadius + wave;

      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);

      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }

    return path + " Z";
  };

  const wavyPath = createWavyCircle();

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Svg width={size} height={size}>
        {/* Glow */}
        <Path
          d={wavyPath}
          fill="none"
          stroke={seen ? "#D1D5DB" : "#3B82F6"}
          strokeWidth={8}
          opacity={0.12}
        />

        {/* Main Ring */}
        <Path
          d={wavyPath}
          fill="none"
          stroke={seen ? "#E5E7EB" : "#2563EB"}
          strokeWidth={strokeWidth}
        />
      </Svg>

      {/* DP Inside Properly */}
      <Image
        source={{ uri }}
        style={{
          position: "absolute",
          width: 50,
          height: 50,
          borderRadius: 35,
        }}
      />
    </View>
  );
};
export default function story() {

  const renderStatusItem = ({ item, viewed }) => (
    <TouchableOpacity style={styles.statusItem}>
      <CurvyRing uri={item.image} seen={viewed} />
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* My Status */}
        <TouchableOpacity style={styles.statusItem}>
          <View>
            <CurvyRing uri={myStatus.image} seen={true} />
            <View style={styles.addIcon}>
              <Feather name="plus" size={14} color="#fff" />
            </View>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.name}>{myStatus.name}</Text>
            <Text style={styles.time}>{myStatus.time}</Text>
          </View>
        </TouchableOpacity>
        {/* Recent Updates */}
        <Text style={styles.sectionTitle}>Recent Updates</Text>
        <FlatList
          data={recentStatus}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            renderStatusItem({ item, viewed: false })
          }
        />

        {/* Viewed Updates */}
        <Text style={styles.sectionTitle}>Viewed Updates</Text>
        <FlatList
          data={viewedStatus}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            renderStatusItem({ item, viewed: true })
          }
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  sectionTitle: {
    color: "#aaa",
    marginTop: 20,
    marginBottom: 8,
    fontWeight: "600",
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
  },
  unseenRing: {
    position: "absolute",
    width: 65,
    height: 65,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#00E5FF",
    top: -5,
    left: -5,
  },
  addIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#6C63FF",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
  },
  time: {
    color: "#aaa",
    fontSize: 13,
    marginTop: 3,
  },
});
