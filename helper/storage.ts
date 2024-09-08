import { RECORD_STORAGE_KEY } from "@/constants/Record";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveRecordsInStorage = async (newMemo: Memo) => {
  try {
    const savedMemos = await AsyncStorage.getItem(RECORD_STORAGE_KEY);
    const memosArray = savedMemos ? JSON.parse(savedMemos) : [];
    memosArray.unshift(newMemo); // 将新的 memo 添加到数组的前面
    await AsyncStorage.setItem(RECORD_STORAGE_KEY, JSON.stringify(memosArray));
    console.log("Memos saved to storage");
  } catch (e) {
    console.error("Failed to save memo to storage", e);
  }
};
