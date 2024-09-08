import { RECORD_STORAGE_KEY } from "@/constants/Record";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";

type useLoadRecordsProps = {
  setMemos: React.Dispatch<React.SetStateAction<Memo[]>>;
};

export const useLoadRecords = ({ setMemos }: useLoadRecordsProps) => {
  useEffect(() => {
    async function loadMemos() {
      try {
        const savedMemos = await AsyncStorage.getItem(RECORD_STORAGE_KEY);
        if (savedMemos) {
          setMemos(JSON.parse(savedMemos));
        }
      } catch (e) {
        console.error("Failed to load memos from storage", e);
      }
    }

    loadMemos();
  }, []);
};
