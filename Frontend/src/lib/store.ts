"use client";

interface SharedData {
  pendingChatForm: FormData | null;
}

export const sharedData: SharedData = {
  pendingChatForm: null,
};
