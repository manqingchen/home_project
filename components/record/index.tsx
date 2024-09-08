import { View, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useMemo } from "react";
import { AVPlaybackStatus, Audio } from "expo-av";
import { Sound } from "expo-av/build/Audio";
import { Extrapolate, interpolate } from "react-native-reanimated";
import { formatMillis } from "@/helper";

type MemoListItemProps = {
  memo: Memo;
  handleDeleteRecording: (memo: Memo) => void;
};
const MemoListItem = (props: MemoListItemProps) => {
  const { memo, handleDeleteRecording } = props;
  const [sound, setSound] = useState<Sound>();
  const [status, setStatus] = useState<AVPlaybackStatus>();

  const loadSound = useCallback(async () => {
    const { sound } = await Audio.Sound.createAsync(
      { uri: memo.uri },
      { progressUpdateIntervalMillis: 1000 / 60 },
      onPlaybackStatusUpdate
    );
    setSound(sound);
  }, [memo.uri]);

  const onPlaybackStatusUpdate = useCallback(
    async (newStatus: AVPlaybackStatus) => {
      setStatus(newStatus);
      if (!newStatus.isLoaded || !sound) return;
      if (newStatus.didJustFinish) await sound.setPositionAsync(0);
    },
    [sound]
  );

  useEffect(() => {
    loadSound();
  }, [loadSound]);

  const playSound = useCallback(async () => {
    if (!sound) return;
    if (status?.isLoaded && status.isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.replayAsync();
    }
  }, [sound, status]);

  useEffect(() => {
    if (!sound) return;

    return () => {
      console.log("Unloading Sound");
      sound.unloadAsync();
    };
  }, [sound]);

  const isPlaying = status?.isLoaded ? status.isPlaying : false;
  const position = status?.isLoaded ? status.positionMillis : 0;
  const duration = status?.isLoaded ? status.durationMillis : 1;
  const progress = position / duration!;

  const calculateLineHeight = (db: number) => {
    return interpolate(db, [-60, 0], [5, 50], Extrapolate.CLAMP);
  };

  const lines = useMemo(() => {
    const result = [];
    let numLines = 30;
    const len = memo.metering.length;

    for (let i = 0; i < numLines; i++) {
      const meteringIndex = (i * len) / numLines;
      const nextMeteringIndex = ((i + 1) * len) / numLines;

      const values = memo.metering.slice(
        Math.floor(meteringIndex),
        Math.ceil(nextMeteringIndex)
      );
      const average = values.reduce((sum, a) => sum + a, 0) / values.length;

      result.push(average);
    }

    return result;
  }, [memo.metering]);

  return (
    <View style={styles.container}>
      <FontAwesome5
        onPress={playSound}
        name={isPlaying ? "pause" : "play"}
        size={20}
        color={"gray"}
      />

      <View style={styles.playbackContainer}>
        <View style={styles.wave}>
          {lines.map((db, index) => (
            <View
              key={index}
              style={[
                styles.waveLine,
                {
                  height: calculateLineHeight(db),
                  backgroundColor:
                    progress > index / lines.length ? "royalblue" : "gainsboro",
                },
              ]}
            />
          ))}
        </View>

        {duration ? (
          <Text
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              color: "gray",
              fontFamily: "Inter",
              fontSize: 12,
            }}
          >
            {formatMillis(position || 0)} / {formatMillis(duration || 0)}
          </Text>
        ) : null}

        <Text onPress={() => handleDeleteRecording(memo)}>delete {memo.fileName}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 15,

    // shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,

    elevation: 3,
  },

  playbackContainer: {
    flex: 1,
    height: 80,
    justifyContent: "center",
  },
  playbackBackground: {
    height: 3,
    backgroundColor: "gainsboro",
    borderRadius: 5,
  },
  playbackIndicator: {
    width: 10,
    aspectRatio: 1,
    borderRadius: 10,
    backgroundColor: "royalblue",
    position: "absolute",
  },

  wave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  waveLine: {
    flex: 1,
    height: 30,
    backgroundColor: "gainsboro",
    borderRadius: 20,
  },
});

export default MemoListItem;
