const PHONE_ID = "107612478652254";
const WABA_ID = "107697061976892";
const BUSINESS_PHONE = "5519998056642";
const phone = value => typeof value === "string" && /^\d{7,15}$/.test(value);
const messageId = value => typeof value === "string" && /^wamid\.[\w=+./:-]{1,400}$/.test(value);
const timestamp = value => typeof value === "string" && /^\d{1,13}$/.test(value);
const requireArray = value => {
  if (!Array.isArray(value)) throw Error("invalid_event_list");
  return value;
};

export function normalizeCoexistenceEntries(entries) {
  const events = [];
  for (const entry of requireArray(entries)) {
    if (entry.id !== WABA_ID) throw Error("unexpected_waba");
    for (const change of requireArray(entry.changes)) {
      const echo = change.field === "smb_message_echoes";
      if (!echo && change.field !== "messages") continue;
      const value = change.value;
      if (value?.metadata?.phone_number_id !== PHONE_ID) throw Error("unexpected_phone");
      for (const m of requireArray(echo ? value.message_echoes : (value.messages ?? []))) {
        const peer = echo ? m.to : m.from;
        if (!messageId(m.id) || !phone(peer) || (echo && m.from !== BUSINESS_PHONE))
          throw Error("invalid_participants");
        if (m.type === "text" && (typeof m.text?.body !== "string" || m.text.body.length > 16000))
          throw Error("invalid_text");
        events.push({phoneNumberId:PHONE_ID, providerMessageId:m.id, sender:peer,
          kind:m.type === "text" ? "text" : "unsupported", body:m.type === "text" ? m.text.body : null,
          timestamp:timestamp(m.timestamp) ? m.timestamp : null, eventType:echo ? "echo" : "incoming"});
      }
      for (const s of requireArray(value.statuses ?? [])) {
        if (!messageId(s.id) || !phone(s.recipient_id) || !timestamp(s.timestamp) ||
            !["sent","delivered","read","failed"].includes(s.status)) throw Error("invalid_status");
        events.push({phoneNumberId:PHONE_ID, providerMessageId:s.id, sender:s.recipient_id,
          kind:"status", body:null, timestamp:s.timestamp, eventType:s.status});
      }
      if (events.length > 50) throw Error("batch_too_large");
    }
  }
  return events;
}
