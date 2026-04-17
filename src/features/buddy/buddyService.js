const STOP_WORDS = new Set(["and", "of", "the"]);

const ABBREVIATIONS = {
  algo: "algorithms",
  algos: "algorithms",
  dsa: "data structures algorithms",
  ds: "data structures",
  ai: "artificial intelligence",
  ml: "machine learning",
};

class BuddyService {
  constructor({ storage, logger }) {
    this.storage = storage;
    this.logger = logger;
  }

  registrationKey(userId, guildId) {
    return `${String(guildId)}:${String(userId)}`;
  }

  normalizeSubject(subject) {
    const input = String(subject || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ");

    if (!input) {
      return "";
    }

    const expanded = [];
    for (const token of input.split(/\s+/)) {
      if (!token) {
        continue;
      }

      const replacement = ABBREVIATIONS[token] || token;
      expanded.push(...replacement.split(/\s+/));
    }

    const uniqueTokens = [];
    const seen = new Set();

    for (const token of expanded
      .map((value) => value.trim())
      .filter((value) => value && !STOP_WORDS.has(value))) {
      if (!seen.has(token)) {
        seen.add(token);
        uniqueTokens.push(token);
      }
    }

    return uniqueTokens.join(" ").replace(/\s+/g, " ").trim();
  }

  extractKeywords(subject) {
    const normalized = this.normalizeSubject(subject);
    if (!normalized) {
      return [];
    }

    return [...new Set(normalized.split(" ").filter(Boolean))];
  }

  getRegistrationRecord(entry) {
    if (!entry || typeof entry !== "object") {
      return null;
    }

    const normalizedSubject = this.normalizeSubject(
      entry.normalizedSubject || entry.subject,
    );
    const keywordSet = Array.isArray(entry.keywordSet)
      ? [
          ...new Set(
            entry.keywordSet
              .map((k) =>
                String(k || "")
                  .trim()
                  .toLowerCase(),
              )
              .filter(Boolean),
          ),
        ]
      : this.extractKeywords(normalizedSubject);

    return {
      ...entry,
      serverId: String(entry.serverId || entry.guildId || "").trim() || null,
      guildId: String(entry.guildId || entry.serverId || "").trim() || null,
      normalizedSubject,
      keywordSet,
      status: String(entry.status || "available")
        .trim()
        .toLowerCase(),
    };
  }

  countKeywordOverlap(userKeywords, candidateKeywords) {
    const keywordLookup = new Set(
      Array.isArray(userKeywords) ? userKeywords : [],
    );
    return (Array.isArray(candidateKeywords) ? candidateKeywords : []).reduce(
      (total, keyword) => (keywordLookup.has(keyword) ? total + 1 : total),
      0,
    );
  }

  findMatch(user) {
    const registration = this.getRegistrationRecord(user);
    if (!registration?.serverId || !registration?.userId) {
      return null;
    }

    const data = this.storage.loadData(this.logger);
    const candidates = Object.values(data.users)
      .map((entry) => this.getRegistrationRecord(entry))
      .filter((entry) => {
        if (!entry) {
          return false;
        }

        if (
          String(entry.serverId || "") !== String(registration.serverId || "")
        ) {
          return false;
        }

        if (String(entry.userId || "") === String(registration.userId || "")) {
          return false;
        }

        if (String(entry.status || "available") !== "available") {
          return false;
        }

        const overlap = this.countKeywordOverlap(
          registration.keywordSet,
          entry.keywordSet,
        );

        return overlap >= 2;
      })
      .map((entry) => ({
        userId: String(entry.userId),
        username: entry.username || null,
        normalizedSubject: entry.normalizedSubject,
      }));

    if (!candidates.length) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  registerSubject(user, guildId, subject) {
    const trimmedSubject = String(subject || "").trim();
    const normalizedSubject = this.normalizeSubject(trimmedSubject);
    const keywordSet = this.extractKeywords(normalizedSubject);

    if (!guildId) {
      return { ok: false, code: "MISSING_GUILD" };
    }

    if (!trimmedSubject || !normalizedSubject || !keywordSet.length) {
      return { ok: false, code: "EMPTY_SUBJECT" };
    }

    const data = this.storage.loadData(this.logger);
    const key = this.registrationKey(user.id, guildId);
    const previous = data.users[key] || null;

    data.users[key] = {
      userId: String(user.id),
      serverId: String(guildId),
      guildId: String(guildId),
      subject: trimmedSubject,
      normalizedSubject,
      keywordSet,
      username: user.username,
      status: previous?.status === "busy" ? "busy" : "available",
      updatedAt: new Date().toISOString(),
    };

    this.storage.saveData(data, this.logger);
    return { ok: true, subject: trimmedSubject, normalizedSubject, keywordSet };
  }

  getRegistration(userId, guildId) {
    if (!guildId) {
      return null;
    }

    const data = this.storage.loadData(this.logger);
    const key = this.registrationKey(userId, guildId);
    return this.getRegistrationRecord(data.users[key]);
  }

  clearRegistration(userId, guildId) {
    if (!guildId) {
      return { ok: false, code: "MISSING_GUILD" };
    }

    const data = this.storage.loadData(this.logger);
    const key = this.registrationKey(userId, guildId);

    if (!data.users[key]) {
      return { ok: false, code: "NOT_REGISTERED" };
    }

    delete data.users[key];
    this.storage.saveData(data, this.logger);
    return { ok: true };
  }

  setStatus(userId, guildId, status) {
    if (!guildId) {
      return { ok: false, code: "MISSING_GUILD" };
    }

    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase();

    if (!["available", "busy"].includes(normalizedStatus)) {
      return { ok: false, code: "INVALID_STATUS" };
    }

    const data = this.storage.loadData(this.logger);
    const key = this.registrationKey(userId, guildId);
    const registration = data.users[key];

    if (!registration) {
      return { ok: false, code: "NOT_REGISTERED" };
    }

    registration.status = normalizedStatus;
    registration.updatedAt = new Date().toISOString();
    data.users[key] = registration;
    this.storage.saveData(data, this.logger);
    return { ok: true, status: normalizedStatus };
  }

  getCandidatesForSubject(subject, excludeUserId, guildId) {
    const userKeywordSet = this.extractKeywords(subject);
    const data = this.storage.loadData(this.logger);

    return Object.values(data.users)
      .map((entry) => this.getRegistrationRecord(entry))
      .filter((entry) => {
        if (!entry) {
          return false;
        }

        if (String(entry.serverId || "") !== String(guildId || "")) {
          return false;
        }

        if (String(entry?.userId || "") === String(excludeUserId)) {
          return false;
        }

        if (String(entry?.status || "available") !== "available") {
          return false;
        }

        return this.countKeywordOverlap(userKeywordSet, entry.keywordSet) >= 2;
      })
      .map((entry) => ({
        userId: String(entry.userId),
        username: entry.username || null,
        subject: entry.subject,
        normalizedSubject: entry.normalizedSubject,
      }));
  }

  findBuddyForUser(userId, guildId) {
    const registration = this.getRegistration(userId, guildId);
    if (!registration) {
      return { ok: false, code: "NOT_REGISTERED" };
    }

    if (registration.status === "busy") {
      return { ok: false, code: "USER_BUSY", subject: registration.subject };
    }

    const match = this.findMatch({
      ...registration,
      userId: String(userId),
      serverId: String(guildId),
      guildId: String(guildId),
    });

    if (!match) {
      return {
        ok: false,
        code: "NO_BUDDY_FOUND",
        subject: registration.subject,
      };
    }

    return {
      ok: true,
      subject: registration.subject,
      buddy: match,
    };
  }
}

module.exports = {
  BuddyService,
};
