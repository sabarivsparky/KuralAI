import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { submitComplaint, transcribeVoice } from "../services/api";
import { blobToWav } from "../utils/toWav";
import MessageBubble from "./MessageBubble";

const MAX_RECORD_MS = 25000; // keep under Sarvam's 30 second limit

const ChatBox = () => {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;

  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [messages, setMessages] = useState([]);

  const bottomRef = useRef(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    setMessages((current) => {
      const welcome = { id: 1, message: t("welcome"), sender: "ai" };
      if (current.length === 0) return [welcome];
      return current.map((m) => (m.id === 1 ? welcome : m));
    });
  }, [t, language]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    };
  }, []);

  // Tap once to start recording, tap again to stop and transcribe
  const toggleRecording = async () => {
    if (listening) {
      clearTimeout(timerRef.current);
      mediaRef.current?.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setListening(false);
        console.log("1. stopped, chunks:", chunksRef.current.length);
        if (chunksRef.current.length === 0) return;

        setTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: rec.mimeType });
          console.log("2. recorded:", blob.size, "bytes", blob.type);
          const wav = await blobToWav(blob);
          console.log("3. wav ready:", wav.size, "bytes");
          const transcript = await transcribeVoice({ audio: wav, language });
          console.log("4. transcript:", transcript);
          setText(transcript || "");
        } catch (err) {
          console.error("Voice step failed:", err);
          alert(t("voiceFailed"));
        } finally {
          setTranscribing(false);
        }
      };

      mediaRef.current = rec;
      rec.start();
      setListening(true);

      timerRef.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, MAX_RECORD_MS);
    } catch (err) {
      console.error("Mic error:", err.name, err.message);
      alert(`${t("micDenied")}\n(${err.name})`);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((!text.trim() && !photo) || loading || transcribing) return;

    const complaintText = text.trim();
    const sentPhoto = photo;

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        message: complaintText,
        sender: "user",
        image: sentPhoto ? URL.createObjectURL(sentPhoto) : null,
      },
    ]);
    setText("");
    setPhoto(null);
    setLoading(true);

    try {
      const data = await submitComplaint({ text: complaintText, language, photo: sentPhoto });

      const a = data.listener?.analysis;
      let reply = a?.citizenReply || t("received");
      if (a) {
        reply += `\n\n${t("issue")}: ${a.issueType} · ${t("severity")}: ${a.severity}/5`;
        if (a.englishTranslation) {
          reply += `\n${t("englishTranslation")}: ${a.englishTranslation}`;
        }
      }

      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, message: reply, sender: "ai", note: t("draftNote") },
      ]);
    } catch (error) {
      console.error("Complaint submission failed:", error);
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, message: t("error"), sender: "ai" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const placeholder = listening
    ? t("listening")
    : transcribing
    ? t("transcribing")
    : t("inputPlaceholder");

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((item) => (
          <MessageBubble
            key={item.id}
            message={item.message}
            sender={item.sender}
            image={item.image}
            note={item.note}
          />
        ))}
        {loading && <MessageBubble message={t("loading")} sender="ai" />}
        <div ref={bottomRef} />
      </div>

      {photo && <div className="photo-preview">📎 {photo.name}</div>}

      <form className="chat-form" onSubmit={handleSubmit}>
        <label className="icon-btn" title={t("addPhoto")}>
          📷
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setPhoto(e.target.files[0] || null)}
          />
        </label>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleRecording}
          disabled={transcribing}
          title={t("speak")}
        >
          {transcribing ? "⏳" : listening ? "🔴" : "🎤"}
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={loading || transcribing}
        />

        <button type="submit" disabled={loading || transcribing || (!text.trim() && !photo)}>
          {loading ? "..." : t("send")}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;