import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Dimensions,
  Animated,
  Alert,
  Easing,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { VideoView, useVideoPlayer } from "expo-video";
import Slider from "@react-native-community/slider";
import { useStory } from "../../context/StoryContext";
import { useAuth } from "../../context/AuthContext";
import Svg, { Path } from "react-native-svg";
import { useFocusEffect } from "@react-navigation/native";
import AppStatusBar from "../../components/AppStatusBar";
import { useTheme } from "../../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const CAPTION_HEIGHT = 70;

const StoryVideoPlayer = ({
  uri,
  isActive,
  isPaused,
  onEnd,
  progress,
  mediaHeight,
}) => {
  const player = useVideoPlayer(uri);

  const rafRef = useRef(null);

  const pausedRef = useRef(false);

  const activeRef = useRef(false);

  /*
   Track active state
  */
  useEffect(() => {
    activeRef.current = isActive;

    if (!player) return;

    if (!isActive) {
      player.pause();

      cancelAnimationFrame(rafRef.current);

      return;
    }

    if (!isPaused) {
      player.play();

      startTracking();
    }
  }, [isActive]);

  /*
   Pause / Resume handling
  */
  useEffect(() => {
    pausedRef.current = isPaused;

    if (!player || !isActive) return;

    if (isPaused) {
      console.log("⏸ PAUSE VIDEO");

      player.pause();

      cancelAnimationFrame(rafRef.current);
    } else {
      console.log("▶ PLAY VIDEO");

      player.play();

      startTracking();
    }
  }, [isPaused]);

  /*
   Frame-accurate progress tracking
  */
  const startTracking = () => {
    cancelAnimationFrame(rafRef.current);

    const track = () => {
      if (!player) return;

      if (!activeRef.current) return;

      if (pausedRef.current) return;

      if (!player.duration) {
        rafRef.current = requestAnimationFrame(track);

        return;
      }

      const percent = player.currentTime / player.duration;

      progress.setValue(percent);

      if (percent >= 0.99) {
        onEnd();

        return;
      }

      rafRef.current = requestAnimationFrame(track);
    };

    rafRef.current = requestAnimationFrame(track);
  };

  /*
   Cleanup
  */
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <VideoView
      player={player}
      style={{ width, height: mediaHeight }}
      nativeControls={false}
      contentFit="contain"
    />
  );
};

export default function story() {
  const {
    addStory,
    fetchMyStories,
    fetchVisibleStories,
    myStories,
    viewStory,
    visibleStories,
    deleteStory,
    loading,
  } = useStory();

  const { user } = useAuth();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [captionVisible, setCaptionVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [caption, setCaption] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textStoryVisible, setTextStoryVisible] = useState(false);
  const [textStory, setTextStory] = useState("");
  const [bgColor, setBgColor] = useState("#2563EB");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStories, setViewerStories] = useState([]);
  const [viewerUser, setViewerUser] = useState(null);
  const [viewersVisible, setViewersVisible] = useState(false);
  const [selectedViewers, setSelectedViewers] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  const StoryMedia = ({ item }) => {
    if (item.type === "video") {
      const player = useVideoPlayer(item.uri);

      return (
        <VideoView
          player={player}
          style={styles.fullMedia}
          fullscreenOptions={{ enabled: false }}
          pictureInPictureOptions={{ enabled: false }}
        />
      );
    }

    return (
      <Image
        source={{ uri: item.uri }}
        style={styles.fullMedia}
        resizeMode="contain"
      />
    );
  };

  const progress = useRef(new Animated.Value(0)).current;

  const progressAnim = useRef(null);

  const pauseStoryProgress = () => {
    const story = viewerStories[currentIndex];

    if (!story) return;

    // ✅ DO NOTHING for videos
    if (story.media?.format === "video") return;

    progressAnim.current?.stop();
  };

  const resumeStoryProgress = () => {
    const story = viewerStories[currentIndex];

    if (!story) return;

    // ✅ DO NOT animate videos
    if (story.media?.format === "video") return;

    progress.stopAnimation((currentValue) => {
      const remaining = (1 - currentValue) * 5000;

      progressAnim.current = Animated.timing(progress, {
        toValue: 1,
        duration: remaining,
        useNativeDriver: false,
      });

      progressAnim.current.start(({ finished }) => {
        if (finished) goToNextStory();
      });
    });
  };

  const flatListRef = useRef();

  useEffect(() => {
    if (!viewerVisible) return;

    flatListRef.current?.scrollToIndex({
      index: currentIndex,
      animated: false, // IMPORTANT: false prevents animation conflict
    });
  }, [currentIndex, viewerVisible]);

  useEffect(() => {
    if (viewersVisible) {
      setIsPaused(true);
    } else {
      setIsPaused(false);
    }
  }, [viewersVisible]);

  const openMediaPicker = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets);

      setPickerVisible(false);

      setCaptionVisible(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (isActive) {
        fetchMyStories();
        fetchVisibleStories();
      }

      return () => {
        isActive = false;
      };
    }, []),
  );

  const hasMyStory = myStories && myStories.length > 0;

  const AnimatedPath = Animated.createAnimatedComponent(Path);

  const CurvyRing = ({ uri, seen, isMyStatus, hasStory, loading }) => {
    const size = 90;
    const center = size / 2;
    const baseRadius = 36;
    const waveAmplitude = 6;
    const waveCount = 7;
    const strokeWidth = 3;

    const dashOffset = useRef(new Animated.Value(0)).current;

    // IMPORTANT: real path length approximation
    const circumference = 2 * Math.PI * (baseRadius + waveAmplitude);

    useEffect(() => {
      if (loading) {
        dashOffset.setValue(0);

        Animated.loop(
          Animated.timing(dashOffset, {
            toValue: -circumference, // NEGATIVE = CLOCKWISE
            duration: 1400,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
        ).start();
      } else {
        dashOffset.stopAnimation();
        dashOffset.setValue(0);
      }
    }, [loading]);

    const createWavyCircle = () => {
      let path = "";

      for (let i = 0; i <= 360; i++) {
        const angle = (i * Math.PI * 2) / 360;

        const wave = Math.sin(angle * waveCount) * waveAmplitude;

        const r = baseRadius + wave;

        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);

        if (i === 0) path += `M ${x} ${y}`;
        else path += ` L ${x} ${y}`;
      }

      return path + " Z";
    };

    // RESTORED YOUR ORIGINAL LOGIC
    const strokeColor = loading
      ? "#2563EB"
      : isMyStatus
        ? hasStory
          ? "#2563EB"
          : "#E5E7EB"
        : seen
          ? "#E5E7EB"
          : "#2563EB";

    const grayColor = "#E5E7EB";

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
          {/* BASE TRACK */}
          <Path
            d={createWavyCircle()}
            fill="none"
            stroke={grayColor}
            strokeWidth={strokeWidth}
          />

          {/* LOADING TRAIN */}
          {loading && (
            <AnimatedPath
              d={createWavyCircle()}
              fill="none"
              stroke="#2563EB"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.22} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          )}

          {/* NORMAL STATE */}
          {!loading && (
            <Path
              d={createWavyCircle()}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          )}
        </Svg>

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

  const uploadStory = async ({ type = "media" } = {}) => {
    try {
      // TEXT STORY

      setCaptionVisible(false);
      setTextStoryVisible(false);

      if (type === "text") {
        await addStory({
          type: "text",
          caption: textStory,
          textStyle: {
            backgroundColor: bgColor,
            textColor: textColor,
            font: "default",
          },
          privacy: "public",
        });
        await fetchMyStories();
        await fetchVisibleStories();
      }

      //MEDIA STORY

      if (type === "media") {
        await addStory({
          type: "media",
          mediaFiles: selectedMedia,
          caption: caption,
          privacy: "public",
        });
        await fetchMyStories();
        await fetchVisibleStories();
      }

      //RESET STATE

      setCaptionVisible(false);
      setTextStoryVisible(false);

      setSelectedMedia([]);
      setCaption("");
      setTextStory("");

      console.log("✅ Story uploaded successfully");
    } catch (error) {
      console.log("❌ Upload error:", error);
    }
  };

  const handleMyStatusPress = () => {
    if (myStories && myStories.length > 0) {
      // open story viewer
      setViewerStories([...myStories].reverse());
      setViewerUser(user);
      setCurrentIndex(0);
      setViewerVisible(true);
    } else {
      // open add story modal
      setPickerVisible(true);
    }
  };

  const goToNextStory = () => {
    if (currentIndex < viewerStories.length - 1) {
      setCurrentIndex((prev) => {
        const next = prev + 1;

        if (next >= viewerStories.length) {
          setViewerVisible(false);
          return prev;
        }

        return next;
      });
    } else {
      setViewerVisible(false);
    }
  };

  useEffect(() => {
    if (!viewerVisible) return;
    if (!viewerStories.length) return;

    const story = viewerStories[currentIndex];
    if (!story) return;

    progressAnim.current?.stop();
    progress.setValue(0);

    // ✅ IMPORTANT: DO NOT animate progress for video
    if (story.media?.format === "video") return;

    const timer = setTimeout(() => {
      progressAnim.current = Animated.timing(progress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      });

      progressAnim.current.start(({ finished }) => {
        if (finished) goToNextStory();
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [currentIndex, viewerStories, viewerVisible]);
  useEffect(() => {
    if (viewerVisible) {
      progressAnim.current?.stop();
      progress.setValue(0);
    }
  }, [viewerVisible]);

  useEffect(() => {
    if (!viewerVisible) return;

    const currentStory = viewerStories[currentIndex];

    if (!currentStory) return;

    viewStory(currentStory._id);
  }, [viewerVisible, currentIndex]);

  useEffect(() => {
    // when viewer closes, refresh visible stories
    if (!viewerVisible) {
      fetchVisibleStories();
    }
  }, [viewerVisible]);

  // Split stories into Recent and Viewed
  const recentStories = visibleStories.filter((item) => item.unseenCount > 0);

  const viewedStories = visibleStories.filter((item) => item.unseenCount === 0);

  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <AppStatusBar backgroundColor={theme.colors.background} style="dark" />
        <View style={styles.container}>
          {/* My Status */}
          <TouchableOpacity
            style={styles.statusItem}
            onPress={handleMyStatusPress}
          >
            <View>
              <CurvyRing
                uri={
                  user?.profileImage?.url || "https://i.pravatar.cc/150?img=5"
                }
                isMyStatus={true}
                hasStory={hasMyStory}
                loading={loading}
              />

              <TouchableOpacity style={styles.addIcon}>
                <Feather name="plus" size={14} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.name}>
                {hasMyStory ? "My Status" : "Add Status"}
              </Text>
              <Text style={styles.time}>Tap to add status update</Text>
            </View>
          </TouchableOpacity>

          {/* Recent Updates */}
          {recentStories.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent Updates</Text>

              <FlatList
                data={recentStories}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({ item }) => {
                  const isSeen = item.unseenCount === 0;

                  return (
                    <TouchableOpacity
                      style={styles.statusItem}
                      onPress={() => {
                        setViewerStories(item.stories);

                        setViewerUser({
                          name: item.name,
                          profileImage: item.profileImage?.url,
                        });

                        setCurrentIndex(0);
                        setViewerVisible(true);
                      }}
                    >
                      <CurvyRing uri={item.profileImage?.url} seen={isSeen} />

                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.name}>{item.name}</Text>

                        <Text style={styles.time}>
                          {item.unseenCount > 0
                            ? `${item.unseenCount} new`
                            : "Viewed"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}

          {/* Viewed Updates */}
          {viewedStories.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Viewed Updates</Text>

              <FlatList
                data={viewedStories}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.statusItem}
                    onPress={() => {
                      setViewerStories(item.stories);

                      setViewerUser({
                        name: item.name,
                        profileImage: item.profileImage?.url,
                      });

                      setCurrentIndex(0);
                      setViewerVisible(true);
                    }}
                  >
                    <CurvyRing uri={item.profileImage?.url} seen={true} />

                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.time}>Viewed</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      </SafeAreaView>

      <Modal visible={viewerVisible} animationType="fade">
        <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
          <View style={styles.progressContainer}>
            {viewerStories.map((_, i) => {
              let flexValue;

              if (i < currentIndex) {
                flexValue = 1;
              } else if (i === currentIndex) {
                flexValue = progress;
              } else {
                flexValue = 0;
              }

              return (
                <View key={i} style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width:
                          i < currentIndex
                            ? "100%"
                            : i === currentIndex
                              ? progress.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0%", "100%"],
                                })
                              : "0%",
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 15,
              paddingVertical: 20,
            }}
          >
            {/* LEFT SIDE */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {/* CLOSE */}
              <TouchableOpacity onPress={() => setViewerVisible(false)}>
                <Feather name="x" size={26} color="white" />
              </TouchableOpacity>

              {/* PROFILE IMAGE */}
              <Image
                source={{
                  uri:
                    viewerUser?.profileImage?.url ??
                    viewerUser?.profileImage ??
                    "https://i.pravatar.cc/150?img=5",
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  marginLeft: 12,
                }}
              />

              {/* NAME */}
              <Text
                style={{
                  color: "white",
                  marginLeft: 10,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {viewerUser?.name}
              </Text>
            </View>

            {/* RIGHT SIDE */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* DELETE */}
              {viewerStories[currentIndex]?.userId === user?._id && (
                <TouchableOpacity
                  style={{ marginRight: 18 }}
                  onPress={() => {
                    const storyId = viewerStories[currentIndex]._id;

                    Alert.alert(
                      "Delete Story",
                      "Are you sure you want to delete this story?",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: async () => {
                            await deleteStory(storyId);

                            const updatedStories = viewerStories.filter(
                              (story) => story._id !== storyId,
                            );

                            if (updatedStories.length === 0) {
                              setViewerVisible(false);
                            } else {
                              setViewerStories(updatedStories);

                              if (currentIndex >= updatedStories.length) {
                                setCurrentIndex(updatedStories.length - 1);
                              }
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Feather name="trash-2" size={24} color="red" />
                </TouchableOpacity>
              )}

              {/* ADD */}
              <TouchableOpacity
                onPress={() => {
                  progressAnim.current?.stop();
                  setViewerVisible(false);
                  setPickerVisible(true);
                }}
              >
                <Feather name="plus" size={26} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* STORY LIST */}
          <FlatList
            ref={flatListRef}
            data={viewerStories}
            horizontal
            pagingEnabled
            keyExtractor={(item) => item._id}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentIndex(index);
            }}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={2}
            removeClippedSubviews
            renderItem={({ item, index }) => {
              const isImage = item.media?.format === "image";
              const isVideo = item.media?.format === "video";
              const isText = item.media?.format === "text";

              const mediaHeight = height - CAPTION_HEIGHT - 180;
              // 120 = header + username + progress bars safe space

              return (
                <View
                  style={{
                    width,
                    height,
                    backgroundColor: "black",
                  }}
                  onStartShouldSetResponder={() => true}
                  onResponderGrant={() => {
                    console.log("👆 HOLD START");

                    setIsPaused(true);

                    pauseStoryProgress();
                  }}
                  onResponderRelease={() => {
                    console.log("👆 HOLD END");

                    setIsPaused(false);

                    resumeStoryProgress();
                  }}
                  onResponderTerminate={() => {
                    console.log("👆 HOLD TERMINATED");

                    setIsPaused(false);

                    resumeStoryProgress();
                  }}
                >
                  {/* MEDIA */}
                  <View
                    style={{
                      width,
                      height: mediaHeight,
                      justifyContent: "flex-start",
                      alignItems: "center",
                    }}
                  >
                    {isImage && (
                      <Image
                        source={{ uri: item.media.url }}
                        style={{ width, height: mediaHeight }}
                        resizeMode="contain"
                      />
                    )}

                    {isVideo && (
                      <StoryVideoPlayer
                        uri={item.media.url}
                        isActive={index === currentIndex}
                        isPaused={isPaused}
                        onEnd={goToNextStory}
                        progress={progress}
                        mediaHeight={mediaHeight}
                      />
                    )}

                    {isText && (
                      <View
                        style={{
                          width,
                          height: mediaHeight,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor:
                            item.textStyle?.backgroundColor || "#000",
                        }}
                      >
                        <Text
                          style={{
                            color: item.textStyle?.textColor || "#fff",
                            fontSize: 32,
                            fontWeight: "bold",
                          }}
                        >
                          {item.caption}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* CAPTION */}
                  {(isImage || isVideo) && item.caption?.trim() !== "" && (
                    <View
                      style={{
                        height: CAPTION_HEIGHT,
                        justifyContent: "center",
                        alignItems: "center",
                        paddingHorizontal: 20,
                        backgroundColor: "rgba(0,0,0,0.5)",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 18,
                          textAlign: "center",
                        }}
                      >
                        {item.caption}
                      </Text>
                    </View>
                  )}

                  {/* BOTTOM BAR */}
                  {(item.userId?._id
                    ? item.userId._id === user._id
                    : item.userId === user._id) && (
                    <TouchableOpacity
                      onPress={() => {
                        pauseStoryProgress();
                        setSelectedViewers(item.viewers || []);
                        setViewersVisible(true);
                      }}
                      style={{
                        height: 60,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Feather name="eye" size={22} color="white" />

                      <Text
                        style={{
                          color: "white",
                          marginLeft: 8,
                          fontSize: 16,
                        }}
                      >
                        {item.viewers?.length ?? 0}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={viewersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setViewersVisible(false);

          resumeStoryProgress();
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              height: height * 0.5,
              backgroundColor: "#111",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 10,
            }}
          >
            {/* HANDLE */}
            <View
              style={{
                width: 40,
                height: 5,
                backgroundColor: "#555",
                borderRadius: 3,
                alignSelf: "center",
                marginBottom: 10,
              }}
            />

            {/* HEADER */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                Viewed by
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setViewersVisible(false);
                  resumeStoryProgress(); // ✅ resume here
                }}
              >
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* VIEWERS LIST */}
            <FlatList
              data={selectedViewers}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                console.log("Item: ", item);
                return (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                    }}
                  >
                    {/* PROFILE IMAGE */}
                    <Image
                      source={{
                        uri:
                          item.userId?.profileImage?.url ||
                          "https://i.pravatar.cc/150",
                      }}
                      style={{
                        width: 45,
                        height: 45,
                        borderRadius: 22,
                      }}
                    />

                    {/* NAME + TIME */}
                    <View style={{ marginLeft: 12 }}>
                      <Text
                        style={{
                          color: "white",
                          fontSize: 16,
                        }}
                      >
                        {item.userId?.name || "Unknown"}
                      </Text>

                      <Text
                        style={{
                          color: "#aaa",
                          fontSize: 13,
                          marginTop: 2,
                        }}
                      >
                        {new Date(item.viewedAt).toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: "#aaa",
                    textAlign: "center",
                    marginTop: 20,
                  }}
                >
                  No views yet
                </Text>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={pickerVisible} animationType="slide">
        <SafeAreaView style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>New Story</Text>

            <View style={{ width: 60 }} />
          </View>

          {/* MEDIA STORY BUTTON */}
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={openMediaPicker}
          >
            <Feather name="image" size={24} color="#fff" />
            <Text style={styles.galleryText}>Open Gallery</Text>
          </TouchableOpacity>

          {/* TEXT STORY BUTTON */}
          <TouchableOpacity
            style={[styles.galleryButton, { backgroundColor: "#10B981" }]}
            onPress={() => {
              setPickerVisible(false);
              setTextStoryVisible(true);
            }}
          >
            <Feather name="type" size={24} color="#fff" />
            <Text style={styles.galleryText}>Text Story</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <Modal visible={textStoryVisible} animationType="slide">
        <SafeAreaView
          style={[styles.textContainer, { backgroundColor: bgColor }]}
        >
          {/* HEADER */}
          <View style={styles.textHeader}>
            {/* CLOSE */}
            <TouchableOpacity onPress={() => setTextStoryVisible(false)}>
              <Feather name="x" size={28} color="white" />
            </TouchableOpacity>

            {/* RIGHT ACTIONS */}
            <View style={styles.headerRight}>
              {/* COLOR PICKER BUTTON */}
              <TouchableOpacity
                onPress={() => setShowColorPicker(!showColorPicker)}
                style={styles.colorToggle}
              >
                <Feather name="droplet" size={22} color="white" />
              </TouchableOpacity>

              {/* SEND BUTTON (ONLY WHEN TEXT EXISTS) */}
              {textStory.trim().length > 0 && (
                <TouchableOpacity
                  style={{ marginLeft: 18 }}
                  onPress={() => uploadStory({ type: "text" })}
                >
                  <Feather name="send" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* PREVIEW */}
          <View style={styles.textPreview}>
            <TextInput
              value={textStory}
              onChangeText={setTextStory}
              placeholder="Type a story..."
              placeholderTextColor="#ddd"
              multiline
              textAlign="center"
              style={[
                styles.textInput,
                {
                  color: textColor,
                },
              ]}
            />
          </View>

          {/* COLOR PICKER */}
          {showColorPicker && (
            <View style={styles.colorPopup}>
              {[
                "#2563EB",
                "#10B981",
                "#EF4444",
                "#F59E0B",
                "#8B5CF6",
                "#EC4899",
                "#000000",
              ].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => {
                    setBgColor(color);
                  }}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    bgColor === color && styles.activeColor,
                  ]}
                />
              ))}
            </View>
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={captionVisible} animationType="slide">
        <SafeAreaView style={styles.previewContainer}>
          {/* Header */}
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setCaptionVisible(false)}>
              <Feather name="x" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => uploadStory({ type: "media" })}>
              <Feather name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Media Preview */}
          <FlatList
            data={selectedMedia}
            horizontal
            pagingEnabled
            keyExtractor={(item, index) => index.toString()}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);

              setCurrentIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={styles.mediaWrapper}>
                <StoryMedia item={item} />
              </View>
            )}
          />

          {/* Caption Input */}
          <View style={styles.captionContainer}>
            <TextInput
              placeholder="Write a caption..."
              placeholderTextColor="#ccc"
              value={caption}
              onChangeText={setCaption}
              style={styles.captionInput}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const createStyles = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 15,
      paddingTop: 20,
    },
    sectionTitle: {
      color: theme.colors.text,
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
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: "600",
    },
    time: {
      color: theme.colors.secondaryText,
      fontSize: 13,
      marginTop: 3,
    },
    pickerContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    pickerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
    },

    headerTitle: {
      color: "white",
      fontSize: 18,
      fontWeight: "600",
    },

    cancelText: {
      color: "#3B82F6",
      fontSize: 16,
    },

    galleryButton: {
      backgroundColor: "#2563EB",
      padding: 18,
      margin: 20,
      borderRadius: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },

    galleryText: {
      color: "white",
      marginLeft: 10,
      fontSize: 16,
    },

    previewContainer: {
      flex: 1,
      backgroundColor: "black",
    },

    previewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 15,
    },

    mediaWrapper: {
      width,
      height: height * 0.7,
      justifyContent: "center",
      alignItems: "center",
    },

    fullMedia: {
      width: width,
      height: height * 0.7,
    },

    captionContainer: {
      padding: 15,
    },

    captionInput: {
      color: "white",
      borderBottomWidth: 1,
      borderBottomColor: "#444",
      fontSize: 16,
      paddingVertical: 10,
    },

    textContainer: {
      flex: 1,
    },

    textHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 15,
    },

    textPreview: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30,
    },

    textInput: {
      fontSize: 32,
      fontWeight: "bold",
    },

    colorPicker: {
      flexDirection: "row",
      justifyContent: "center",
      paddingBottom: 30,
    },

    colorCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginVertical: 6,
    },

    activeColor: {
      borderWidth: 2,
      borderColor: "white",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },

    colorToggle: {
      padding: 6,
    },

    colorPopup: {
      position: "absolute",
      top: 70,
      right: 15,
      backgroundColor: "#1f2937",
      padding: 10,
      borderRadius: 12,
      elevation: 5,
    },

    progressContainer: {
      flexDirection: "row",
      position: "absolute",
      top: 10,
      left: 10,
      right: 10,
      zIndex: 10,
    },

    progressBarBackground: {
      flex: 1,
      height: 3,
      backgroundColor: "rgba(255,255,255,0.3)",
      marginHorizontal: 2,
      borderRadius: 2,
      overflow: "hidden",
    },

    progressBarFill: {
      height: 3,
      backgroundColor: "#fff",
    },
  });
};
