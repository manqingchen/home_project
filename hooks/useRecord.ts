import { useState } from "react";
import { Audio } from "expo-av";
import { Recording } from "expo-av/build/Audio";
import { useSharedValue } from "react-native-reanimated";
import { PermissionStatus } from "expo-modules-core/src";
import { saveRecordsInStorage } from "@/helper/storage";

export const useRecord = () => {
  const [recording, setRecording] = useState<Recording>();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [tips, setTips] = useState("");

  const [audioMetering, setAudioMetering] = useState<number[]>([]);
  const metering = useSharedValue(-100);
  async function getRecordPermissionsAsync() {
    const { canAskAgain, status } = await Audio.requestPermissionsAsync();
    if (canAskAgain && status !== PermissionStatus.GRANTED)
      setTips("Please grant microphone permissions in system Settings");
    else if (status === PermissionStatus.DENIED)
      setTips("Select Grant microphone permissions to enable recording");
    else if (status === PermissionStatus.GRANTED) setTips("");
  }

  async function startRecording() {
    try {
      setAudioMetering([]);

      getRecordPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        100
      );
      setRecording(recording);

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering) {
          metering.value = status.metering;
          setAudioMetering((curVal) => [...curVal, status.metering || -100]);
        }
      });
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    if (uri) {
      const index = Math.max(...memos.map((memo) => memo.index), 0) + 1;
      const fileExtension = uri?.split(".").pop() || "m4a";

      const fileName = `audio_file_${new Date().toISOString()}.${fileExtension}`;
      setRecording(undefined);
      metering.value = -100;

      const newMemo = {
        uri,
        index,
        fileName,
        metering: audioMetering,
      };
      setMemos((existingMemos) => [newMemo, ...existingMemos]);
      saveRecordsInStorage(newMemo);
    } else {
      // todo 
      // ? Recording may have failed for unknown reasons, but no suitable demo was found
    }
  }

  const handleDeleteRecording = async (memo: Memo) => {
    setMemos((prevMemos) => prevMemos.filter((item) => item.uri !== memo.uri));
  };

  return {
    memos,
    tips,
    metering,
    recording,
    audioMetering,
    setMemos,
    stopRecording,
    startRecording,
    handleDeleteRecording,
  };
};
