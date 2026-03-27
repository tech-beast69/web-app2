/* Discord Management v4.0 — per-section saves */
(function () {
    const API_BASE = (window.DASHBOARDCONFIG && window.DASHBOARDCONFIG.APIURL) || "";
    const SERVERS_KEY = "discord_managed_servers";
    const SELECTED_KEY = "discord_selected_server";

    const $ = id => document.getElementById(id);
    const els = {
        serverSelect: $("serverSelect"), newGuildId: $("newGuildId"), newGuildName: $("newGuildName"),
        serverRolesSelect: $("serverRolesSelect"), rolesSourceHint: $("rolesSourceHint"),
        joinGateRoleSelect: $("joinGateRoleSelect"), joinGateRolesSourceHint: $("joinGateRolesSourceHint"),
        refreshRolesBtn: $("refreshRolesBtn"), applySelectedRolesBtn: $("applySelectedRolesBtn"),
        logChannelSelect: $("logChannelSelect"), channelsSourceHint: $("channelsSourceHint"),
        joinGateChannelSelect: $("joinGateChannelSelect"), joinGateChannelsSourceHint: $("joinGateChannelsSourceHint"),
        enabled: $("enabled"), exemptAdmins: $("exemptAdmins"), logChannelId: $("logChannelId"),
        antiLinkEnabled: $("antiLinkEnabled"), antiInviteEnabled: $("antiInviteEnabled"),
        antiSpamEnabled: $("antiSpamEnabled"), antiMentionEnabled: $("antiMentionEnabled"),
        antiEveryoneEnabled: $("antiEveryoneEnabled"), antiEmojiEnabled: $("antiEmojiEnabled"),
        antiAttachmentEnabled: $("antiAttachmentEnabled"), antiLineEnabled: $("antiLineEnabled"),
        antiLongEnabled: $("antiLongEnabled"), antiCapsEnabled: $("antiCapsEnabled"),
        newAccountGuardEnabled: $("newAccountGuardEnabled"), warnEscalationEnabled: $("warnEscalationEnabled"),
        raidModeEnabled: $("raidModeEnabled"),
        antiSpamLimit: $("antiSpamLimit"), antiSpamWindow: $("antiSpamWindow"),
        duplicateLimit: $("duplicateLimit"), spamTimeoutSeconds: $("spamTimeoutSeconds"),
        antiSpamAction: $("antiSpamAction"), mentionLimit: $("mentionLimit"),
        mentionTimeoutSeconds: $("mentionTimeoutSeconds"), antiMentionAction: $("antiMentionAction"),
        antiLinkAction: $("antiLinkAction"), antiInviteAction: $("antiInviteAction"),
        allowDomains: $("allowDomains"), exemptRoleIds: $("exemptRoleIds"),
        exemptChannelIds: $("exemptChannelIds"), joinGateEnabled: $("joinGateEnabled"),
        joinGateChannelId: $("joinGateChannelId"), joinGateRoleId: $("joinGateRoleId"),
        joinGateMethod: $("joinGateMethod"), joinGateTimeout: $("joinGateTimeout"),
        joinGateKick: $("joinGateKick"), joinGateRemoveOnFail: $("joinGateRemoveOnFail"),
        useSelectedChannelBtn: $("useSelectedChannelBtn"), useSelectedRoleBtn: $("useSelectedRoleBtn"),
        applyVerificationBtn: $("applyVerificationBtn"),
        emojiLimit: $("emojiLimit"), antiEmojiAction: $("antiEmojiAction"),
        lineLimit: $("lineLimit"), antiLineAction: $("antiLineAction"),
        charLimit: $("charLimit"), antiLongAction: $("antiLongAction"),
        capsRatio: $("capsRatio"), capsMinLength: $("capsMinLength"), antiCapsAction: $("antiCapsAction"),
        attachmentLimit: $("attachmentLimit"), antiAttachmentAction: $("antiAttachmentAction"),
        everyoneMentionLimit: $("everyoneMentionLimit"), antiEveryoneAction: $("antiEveryoneAction"),
        newAccountAgeMinutes: $("newAccountAgeMinutes"), newAccountAction: $("newAccountAction"),
        warnMax: $("warnMax"), warnEscalationAction: $("warnEscalationAction"),
        warnEscalationTimeoutSeconds: $("warnEscalationTimeoutSeconds"),
        raidQuarantineRoleId: $("raidQuarantineRoleId"),
        bannedWords: $("bannedWords"),
        antiProfileEnabled: $("antiProfileEnabled"), antiProfileCheckBioLinks: $("antiProfileCheckBioLinks"),
        antiProfileBlockedNames: $("antiProfileBlockedNames"), antiProfileAction: $("antiProfileAction"),
        antiProfileQuarantineRoleId: $("antiProfileQuarantineRoleId"),
        unquarantineBtn: $("unquarantineBtn"),
        casesLimit: $("casesLimit"), casesBody: $("casesBody"),
        warningsUserId: $("warningsUserId"), warningsList: $("warningsList"),
        addServerBtn: $("addServerBtn"), removeServerBtn: $("removeServerBtn"),
        loadConfigBtn: $("loadConfigBtn"),
        saveLogBtn: $("saveLogBtn"), logSaveStatus: $("logSaveStatus"),
        saveExemptionsBtn: $("saveExemptionsBtn"), exemptSaveStatus: $("exemptSaveStatus"),
        saveFiltersBtn: $("saveFiltersBtn"), filterSaveStatus: $("filterSaveStatus"),
        saveJoinGateBtn: $("saveJoinGateBtn"), joinGateSaveStatus: $("joinGateSaveStatus"),
        refreshConfigBtn: $("refreshConfigBtn"),
        loadCasesBtn: $("loadCasesBtn"), loadWarningsBtn: $("loadWarningsBtn"),
        clearWarningsBtn: $("clearWarningsBtn"),
        toastWrap: $("toastWrap"), connectionStatus: $("connectionStatus"),
        selectedServerLabel: $("selectedServerLabel"), lastActionLabel: $("lastActionLabel"),
        testConnectionBtn: $("testConnectionBtn"),
        presetRelaxedBtn: $("presetRelaxedBtn"), presetBalancedBtn: $("presetBalancedBtn"),
        presetStrictBtn: $("presetStrictBtn"),
        guidedMode: $("guidedMode"), enforcementMode: $("enforcementMode"),
        syncServersBtn: $("syncServersBtn"), applyGuidedBtn: $("applyGuidedBtn"),
        advancedToggle: $("advancedToggle"), advancedSection: $("advancedSection"),
        advancedStateLabel: $("advancedStateLabel"), configChecklist: $("configChecklist")
    };

    let adminId = "";
    let advancedVisible = false;

    /* ── Admin ID ── */
    function persistAdminId(v) {
        const n = String(v || "").trim();
        if (!n) return "";
        adminId = n;
        try { localStorage.setItem("dashboard_user_id", n); } catch (_) {}
        return n;
    }

    function getAdminId() {
        if (adminId) return adminId;
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                if (typeof tg.ready === "function") tg.ready();
                if (typeof tg.expand === "function") tg.expand();
                const tid = String((tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) || "").trim();
                if (tid) return persistAdminId(tid);
            }
        } catch (_) {}
        try {
            const params = new URLSearchParams(window.location.search || "");
            const qid = String(params.get("admin_id") || params.get("user_id") || "").trim();
            if (qid) return persistAdminId(qid);
        } catch (_) {}
        try {
            const fb = localStorage.getItem("dashboard_user_id") || "";
            if (fb) return persistAdminId(fb);
        } catch (_) {}
        return adminId;
    }

    function appendAdminId(path) {
        const id = getAdminId();
        if (!id) return path;
        return path.includes("?") ? `${path}&admin_id=${encodeURIComponent(id)}` : `${path}?admin_id=${encodeURIComponent(id)}`;
    }

    /* ── UI helpers ── */
    function setLastAction(txt) { if (els.lastActionLabel) els.lastActionLabel.textContent = txt; }

    function setConnectionStatus(txt, ok) {
        if (!els.connectionStatus) return;
        els.connectionStatus.textContent = txt;
        els.connectionStatus.style.color = ok ? "var(--success)" : "var(--danger)";
    }

    function notify(msg, type) {
        if (!els.toastWrap) { window.alert(msg); return; }
        const icons = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };
        const t = document.createElement("div");
        t.className = `toast ${type || ""}`.trim();
        t.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${escapeHtml(msg)}`;
        els.toastWrap.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    function setBusy(btn, busy, txt) {
        if (!btn) return;
        if (busy) { btn.dataset.orig = btn.textContent; btn.textContent = txt || "Saving…"; btn.disabled = true; }
        else { btn.disabled = false; if (btn.dataset.orig) btn.textContent = btn.dataset.orig; }
    }

    function setSaveStatus(el, ok, msg) {
        if (!el) return;
        el.className = `save-status ${ok ? "ok" : "err"}`;
        el.innerHTML = ok ? `<i class="fas fa-check"></i> ${msg || "Saved"}` : `<i class="fas fa-xmark"></i> ${msg || "Error"}`;
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.className = "save-status"; el.innerHTML = ""; }, 4000);
    }

    function escapeHtml(s) {
        return String(s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    }

    function numOrDef(v, def, min, max) {
        const n = Number(v);
        if (!Number.isFinite(n)) return def;
        let out = n;
        if (typeof min === "number") out = Math.max(min, out);
        if (typeof max === "number") out = Math.min(max, out);
        return out;
    }

    /* ── Servers ── */
    function loadServers() { try { const d = JSON.parse(localStorage.getItem(SERVERS_KEY) || "[]"); return Array.isArray(d) ? d : []; } catch (_) { return []; } }
    function saveServersLocal(list) { localStorage.setItem(SERVERS_KEY, JSON.stringify(list)); }

    function mergeServers(ex, inc) {
        const seen = new Set(); const merged = [];
        [...(ex||[]), ...(inc||[])].forEach(s => {
            const g = String((s && s.guild_id) || "").trim();
            if (!g || seen.has(g)) return;
            seen.add(g);
            merged.push({ guild_id: g, label: String(s.label || `Guild ${g}`) });
        });
        return merged;
    }

    function renderServers() {
        const list = loadServers();
        els.serverSelect.innerHTML = "";
        if (!list.length) { els.serverSelect.innerHTML = '<option value="">No servers added</option>'; return; }
        const stored = localStorage.getItem(SELECTED_KEY) || "";
        list.forEach(s => {
            const o = document.createElement("option");
            o.value = String(s.guild_id);
            o.textContent = `${s.label || "Guild"} (${s.guild_id})`;
            els.serverSelect.appendChild(o);
        });
        if (stored && list.some(s => String(s.guild_id) === stored)) els.serverSelect.value = stored;
        updateSelectedLabel();
    }

    function selectedGuildId() { return String(els.serverSelect.value || "").trim(); }

    function updateSelectedLabel() {
        const g = selectedGuildId();
        if (els.selectedServerLabel) els.selectedServerLabel.textContent = g || "None";
        if (g) localStorage.setItem(SELECTED_KEY, g);
    }

    /* ── API ── */
    async function api(path, opts) {
        const id = getAdminId();
        if (!id) throw new Error("Admin ID missing — open this page from your Telegram admin account.");
        const fullPath = appendAdminId(path);
        const res = await fetch(`${API_BASE}${fullPath}`, {
            ...(opts || {}),
            headers: { "Content-Type": "application/json", ...((opts && opts.headers) || {}) }
        });
        let payload = null;
        try { payload = await res.json(); } catch (_) {}
        if (!res.ok) throw new Error(payload && (payload.detail || payload.message) ? (payload.detail || payload.message) : `HTTP ${res.status}`);
        setLastAction(`${(opts && opts.method) || "GET"} ${path}`);
        return payload;
    }

    async function patchConfig(gid, body) {
        return api(`/api/discord/moderation/config/${encodeURIComponent(gid)}`, {
            method: "PATCH", body: JSON.stringify(body)
        });
    }

    /* ── Populate form from config ── */
    function applyConfig(cfg) {
        const f = (cfg && cfg.features) || {};
        const check = (el, v) => { if (el) el.checked = !!v; };
        const val = (el, v) => { if (el) el.value = v !== undefined && v !== null ? v : ""; };

        check(els.enabled, cfg.enabled);
        check(els.exemptAdmins, cfg.exempt_admins !== false);
        check(els.raidModeEnabled, f.raid_mode && f.raid_mode.enabled);
        val(els.logChannelId, cfg.log_channel_id);
        if (els.logChannelSelect && cfg.log_channel_id) {
            const o = els.logChannelSelect.querySelector(`option[value="${cfg.log_channel_id}"]`);
            if (o) els.logChannelSelect.value = String(cfg.log_channel_id);
        }

        val(els.exemptRoleIds, (cfg.exempt_role_ids || []).join("\n"));
        val(els.exemptChannelIds, (cfg.exempt_channel_ids || []).join("\n"));
        syncRoleSelectionFromTextarea();

        check(els.antiSpamEnabled, f.anti_spam && f.anti_spam.enabled);
        val(els.antiSpamAction, (f.anti_spam && f.anti_spam.action) || "timeout");
        val(els.antiSpamLimit, (f.anti_spam && f.anti_spam.message_limit) || 6);
        val(els.antiSpamWindow, (f.anti_spam && f.anti_spam.window_seconds) || 10);
        val(els.duplicateLimit, (f.anti_spam && f.anti_spam.duplicate_limit) || 4);
        val(els.spamTimeoutSeconds, (f.anti_spam && f.anti_spam.timeout_seconds) || 600);

        check(els.antiMentionEnabled, f.anti_mention_spam && f.anti_mention_spam.enabled);
        val(els.mentionLimit, (f.anti_mention_spam && f.anti_mention_spam.max_mentions) || 5);
        val(els.mentionTimeoutSeconds, (f.anti_mention_spam && f.anti_mention_spam.timeout_seconds) || 600);
        val(els.antiMentionAction, (f.anti_mention_spam && f.anti_mention_spam.action) || "delete_timeout");

        check(els.antiEveryoneEnabled, f.anti_everyone_mention && f.anti_everyone_mention.enabled);
        val(els.everyoneMentionLimit, (f.anti_everyone_mention && f.anti_everyone_mention.max_mentions) || 0);
        val(els.antiEveryoneAction, (f.anti_everyone_mention && f.anti_everyone_mention.action) || "delete_warn");

        check(els.antiLinkEnabled, f.anti_link && f.anti_link.enabled);
        val(els.antiLinkAction, (f.anti_link && f.anti_link.action) || "delete_warn");
        val(els.allowDomains, ((f.anti_link && f.anti_link.allow_domains) || []).join("\n"));

        check(els.antiInviteEnabled, f.anti_invite && f.anti_invite.enabled);
        val(els.antiInviteAction, (f.anti_invite && f.anti_invite.action) || "delete_warn");

        check(els.antiEmojiEnabled, f.anti_emoji_spam && f.anti_emoji_spam.enabled);
        val(els.emojiLimit, (f.anti_emoji_spam && f.anti_emoji_spam.max_emojis) || 14);
        val(els.antiEmojiAction, (f.anti_emoji_spam && f.anti_emoji_spam.action) || "delete_warn");

        check(els.antiLineEnabled, f.anti_line_spam && f.anti_line_spam.enabled);
        val(els.lineLimit, (f.anti_line_spam && f.anti_line_spam.max_lines) || 12);
        val(els.antiLineAction, (f.anti_line_spam && f.anti_line_spam.action) || "delete_warn");

        check(els.antiLongEnabled, f.anti_long_message && f.anti_long_message.enabled);
        val(els.charLimit, (f.anti_long_message && f.anti_long_message.max_chars) || 1400);
        val(els.antiLongAction, (f.anti_long_message && f.anti_long_message.action) || "warn");

        check(els.antiAttachmentEnabled, f.anti_attachment_spam && f.anti_attachment_spam.enabled);
        val(els.attachmentLimit, (f.anti_attachment_spam && f.anti_attachment_spam.max_attachments) || 3);
        val(els.antiAttachmentAction, (f.anti_attachment_spam && f.anti_attachment_spam.action) || "delete_warn");

        check(els.antiCapsEnabled, f.anti_caps && f.anti_caps.enabled);
        val(els.capsRatio, (f.anti_caps && f.anti_caps.ratio) || 0.8);
        val(els.capsMinLength, (f.anti_caps && f.anti_caps.min_length) || 14);
        val(els.antiCapsAction, (f.anti_caps && f.anti_caps.action) || "warn");

        check(els.newAccountGuardEnabled, f.new_account_guard && f.new_account_guard.enabled);
        val(els.newAccountAgeMinutes, (f.new_account_guard && f.new_account_guard.min_account_age_minutes) || 60);
        val(els.newAccountAction, (f.new_account_guard && f.new_account_guard.action) || "log");

        check(els.warnEscalationEnabled, f.warn_escalation && f.warn_escalation.enabled);
        val(els.warnMax, (f.warn_escalation && f.warn_escalation.max_warns) || 3);
        val(els.warnEscalationAction, (f.warn_escalation && f.warn_escalation.action) || "timeout");
        val(els.warnEscalationTimeoutSeconds, (f.warn_escalation && f.warn_escalation.timeout_seconds) || 1800);

        val(els.raidQuarantineRoleId, (f.raid_mode && f.raid_mode.quarantine_role_id) || "");
        val(els.bannedWords, ((f.banned_words && f.banned_words.words) || []).join("\n"));

        const ap = f.anti_profile || {};
        check(els.antiProfileEnabled, ap.enabled);
        check(els.antiProfileCheckBioLinks, ap.check_bio_links);
        val(els.antiProfileBlockedNames, (ap.blocked_names && Array.isArray(ap.blocked_names) ? ap.blocked_names.join("\n") : (ap.blocked_names || []).join("\n")));
        val(els.antiProfileAction, ap.action || "quarantine");
        val(els.antiProfileQuarantineRoleId, ap.quarantine_role_id || "");

        const jg = f.join_gate || {};
        check(els.joinGateEnabled, jg.enabled);
        val(els.joinGateChannelId, jg.verification_channel_id);
        val(els.joinGateRoleId, jg.verified_role_id);
        val(els.joinGateMethod, jg.method || "button");
        val(els.joinGateTimeout, jg.timeout_seconds || 300);
        check(els.joinGateKick, jg.kick_on_fail);
        check(els.joinGateRemoveOnFail, jg.remove_on_fail !== false);

        if (els.joinGateChannelSelect && jg.verification_channel_id) {
            const o = els.joinGateChannelSelect.querySelector(`option[value="${jg.verification_channel_id}"]`);
            if (o) els.joinGateChannelSelect.value = String(jg.verification_channel_id);
        }
        if (els.joinGateRoleSelect && jg.verified_role_id) {
            const o = els.joinGateRoleSelect.querySelector(`option[value="${jg.verified_role_id}"]`);
            if (o) els.joinGateRoleSelect.value = String(jg.verified_role_id);
        }

        updateChecklist();
    }

    function readIdLines(el) {
        return String((el && el.value) || "").split("\n").map(v => String(v||"").trim()).filter(Boolean);
    }

    /* ── Section-level patch builders ── */
    function buildLogPatch() {
        const chId = els.logChannelId.value.trim() ||
            (els.logChannelSelect && els.logChannelSelect.value) || null;
        return {
            log_channel_id: chId ? numOrDef(chId, null, 1) : null,
            enabled: !!els.enabled.checked,
            exempt_admins: !!els.exemptAdmins.checked,
        };
    }

    function buildExemptionsPatch() {
        const rIds = readIdLines(els.exemptRoleIds).map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0);
        const cIds = readIdLines(els.exemptChannelIds).map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0);
        return { exempt_role_ids: rIds, exempt_channel_ids: cIds };
    }

    function buildFiltersPatch() {
        const words = String((els.bannedWords && els.bannedWords.value) || "").split("\n").map(w => w.trim()).filter(Boolean);
        const domains = String((els.allowDomains && els.allowDomains.value) || "").split("\n").map(w => w.trim().toLowerCase()).filter(Boolean);
        return {
            features: {
                anti_spam: { enabled: !!els.antiSpamEnabled.checked, action: els.antiSpamAction.value, message_limit: numOrDef(els.antiSpamLimit.value, 6, 2, 30), window_seconds: numOrDef(els.antiSpamWindow.value, 10, 3, 120), duplicate_limit: numOrDef(els.duplicateLimit.value, 4, 2, 20), timeout_seconds: numOrDef(els.spamTimeoutSeconds.value, 600, 60, 2419200) },
                anti_mention_spam: { enabled: !!els.antiMentionEnabled.checked, max_mentions: numOrDef(els.mentionLimit.value, 5, 1, 50), timeout_seconds: numOrDef(els.mentionTimeoutSeconds.value, 600, 60, 2419200), action: els.antiMentionAction.value },
                anti_everyone_mention: { enabled: !!els.antiEveryoneEnabled.checked, max_mentions: numOrDef(els.everyoneMentionLimit.value, 0, 0, 10), action: els.antiEveryoneAction.value },
                anti_link: { enabled: !!els.antiLinkEnabled.checked, action: els.antiLinkAction.value, allow_domains: domains },
                anti_invite: { enabled: !!els.antiInviteEnabled.checked, action: els.antiInviteAction.value },
                anti_emoji_spam: { enabled: !!els.antiEmojiEnabled.checked, max_emojis: numOrDef(els.emojiLimit.value, 14, 1, 200), action: els.antiEmojiAction.value },
                anti_line_spam: { enabled: !!els.antiLineEnabled.checked, max_lines: numOrDef(els.lineLimit.value, 12, 2, 100), action: els.antiLineAction.value },
                anti_long_message: { enabled: !!els.antiLongEnabled.checked, max_chars: numOrDef(els.charLimit.value, 1400, 100, 4000), action: els.antiLongAction.value },
                anti_attachment_spam: { enabled: !!els.antiAttachmentEnabled.checked, max_attachments: numOrDef(els.attachmentLimit.value, 3, 1, 20), action: els.antiAttachmentAction.value },
                anti_caps: { enabled: !!els.antiCapsEnabled.checked, ratio: numOrDef(els.capsRatio.value, 0.8, 0.1, 1), min_length: numOrDef(els.capsMinLength.value, 14, 5, 200), action: els.antiCapsAction.value },
                new_account_guard: { enabled: !!els.newAccountGuardEnabled.checked, min_account_age_minutes: numOrDef(els.newAccountAgeMinutes.value, 60, 1, 10080), action: els.newAccountAction.value },
                warn_escalation: { enabled: !!els.warnEscalationEnabled.checked, max_warns: numOrDef(els.warnMax.value, 3, 2, 20), action: els.warnEscalationAction.value, timeout_seconds: numOrDef(els.warnEscalationTimeoutSeconds.value, 1800, 60, 2419200) },
                raid_mode: { enabled: !!els.raidModeEnabled.checked, quarantine_role_id: els.raidQuarantineRoleId && els.raidQuarantineRoleId.value ? numOrDef(els.raidQuarantineRoleId.value, null, 1) : null },
                anti_profile: { enabled: !!(els.antiProfileEnabled && els.antiProfileEnabled.checked), check_bio_links: !!(els.antiProfileCheckBioLinks && els.antiProfileCheckBioLinks.checked), blocked_names: String((els.antiProfileBlockedNames && els.antiProfileBlockedNames.value) || "").split("\n").map(w => w.trim()).filter(Boolean), action: (els.antiProfileAction && els.antiProfileAction.value) || "quarantine", quarantine_role_id: (els.antiProfileQuarantineRoleId && els.antiProfileQuarantineRoleId.value) ? numOrDef(els.antiProfileQuarantineRoleId.value, null, 1) : null },
                banned_words: { words, enabled: true }
            }
        };
    }

    function buildJoinGatePatch() {
        const chId = (els.joinGateChannelId && els.joinGateChannelId.value) ||
            (els.joinGateChannelSelect && els.joinGateChannelSelect.value) || null;
        const rId = (els.joinGateRoleId && els.joinGateRoleId.value) ||
            (els.joinGateRoleSelect && els.joinGateRoleSelect.value) || null;
        return {
            features: {
                join_gate: {
                    enabled: !!(els.joinGateEnabled && els.joinGateEnabled.checked),
                    verification_channel_id: chId ? numOrDef(chId, null, 1) : null,
                    verified_role_id: rId ? numOrDef(rId, null, 1) : null,
                    method: (els.joinGateMethod && els.joinGateMethod.value) || "button",
                    timeout_seconds: numOrDef(els.joinGateTimeout && els.joinGateTimeout.value, 300, 30, 86400),
                    kick_on_fail: !!(els.joinGateKick && els.joinGateKick.checked),
                    remove_on_fail: (els.joinGateRemoveOnFail ? !!els.joinGateRemoveOnFail.checked : true)
                }
            }
        };
    }

    /* ── Sections save ── */
    async function sectionSave(gid, body, btn, statusEl, label) {
        setBusy(btn, true);
        try {
            await patchConfig(gid, body);
            setSaveStatus(statusEl, true, "Saved");
            notify(`${label} saved`, "success");
            updateChecklist();
        } catch (err) {
            setSaveStatus(statusEl, false, "Error");
            notify(`${label} save failed: ${err.message}`, "error");
        } finally {
            setBusy(btn, false);
        }
    }

    /* ── Load config ── */
    async function loadConfig() {
        const gid = selectedGuildId();
        if (!gid) { notify("Select a server first", "error"); return; }
        setBusy(els.loadConfigBtn, true, "Loading…");
        try {
            const res = await api(`/api/discord/moderation/config/${encodeURIComponent(gid)}`);
            applyConfig(res.data || {});
            await Promise.all([fetchChannels(), fetchRoles()]);
            notify("Config loaded", "success");
            setConnectionStatus("Connected", true);
        } catch (err) {
            notify(`Load failed: ${err.message}`, "error");
            setConnectionStatus("Request failed", false);
        } finally {
            setBusy(els.loadConfigBtn, false);
        }
    }

    /* ── Channels ── */
    async function fetchChannels() {
        const gid = selectedGuildId();
        if (!gid || !els.logChannelSelect) return;
        const savedInput = String(els.logChannelId.value || "").trim();
        els.logChannelSelect.innerHTML = '<option value="">— Loading… —</option>';
        if (els.joinGateChannelSelect) els.joinGateChannelSelect.innerHTML = '<option value="">— Loading… —</option>';
        try {
            const payload = await api(`/api/discord/channels/${encodeURIComponent(gid)}`);
            const channels = (payload && payload.data && payload.data.channels) || [];
            const source = (payload && payload.data && payload.data.source) || "";

            function fillSelect(sel, chs, savedId, hint) {
                sel.innerHTML = '<option value="">— Select a channel —</option>';
                chs.forEach(ch => {
                    const o = document.createElement("option");
                    o.value = String(ch.id || "");
                    o.textContent = `#${ch.name || "channel"} (${ch.id || ""})`;
                    sel.appendChild(o);
                });
                if (!chs.length && savedId) {
                    const o = document.createElement("option");
                    o.value = savedId; o.textContent = `Saved (${savedId})`;
                    sel.appendChild(o);
                }
                if (savedId) {
                    const m = sel.querySelector(`option[value="${savedId}"]`);
                    if (m) sel.value = savedId;
                }
                if (hint) hint.textContent = source ? `Source: ${source}` : "";
            }

            fillSelect(els.logChannelSelect, channels, savedInput, els.channelsSourceHint);
            if (els.joinGateChannelSelect) {
                const savedJoin = String(els.joinGateChannelId && els.joinGateChannelId.value ? els.joinGateChannelId.value : "");
                fillSelect(els.joinGateChannelSelect, channels, savedJoin, els.joinGateChannelsSourceHint);
            }
        } catch (err) {
            els.logChannelSelect.innerHTML = '<option value="">— Channel lookup failed —</option>';
            if (savedInput) {
                const o = document.createElement("option");
                o.value = savedInput; o.textContent = `Saved (${savedInput})`;
                els.logChannelSelect.appendChild(o);
                els.logChannelSelect.value = savedInput;
            }
            if (els.channelsSourceHint) els.channelsSourceHint.textContent = "Channel lookup failed.";
        }
    }

    /* ── Roles ── */
    async function fetchRoles() {
        const gid = selectedGuildId();
        if (!gid) return;
        try {
            const payload = await api(`/api/discord/roles/${encodeURIComponent(gid)}`);
            const roles = (payload && payload.data && payload.data.roles) || [];
            const src = (payload && payload.data && payload.data.source) || "";

            function fillRoleSelect(sel, hint) {
                sel.innerHTML = '<option value="">— no roles loaded —</option>';
                roles.forEach(r => {
                    const o = document.createElement("option");
                    o.value = String(r.id || ""); o.textContent = `${r.name || "role"} (${r.id || ""})`;
                    sel.appendChild(o);
                });
                if (hint) hint.textContent = src ? `Source: ${src}` : "";
            }

            fillRoleSelect(els.serverRolesSelect, els.rolesSourceHint);
            if (els.joinGateRoleSelect) fillRoleSelect(els.joinGateRoleSelect, els.joinGateRolesSourceHint);
            syncRoleSelectionFromTextarea();
        } catch (_) {}
    }

    function syncRoleSelectionFromTextarea() {
        if (!els.serverRolesSelect || !els.exemptRoleIds) return;
        const ids = new Set(readIdLines(els.exemptRoleIds));
        Array.from(els.serverRolesSelect.options).forEach(o => {
            o.selected = ids.has(String(o.value));
        });
    }

    /* ── Checklist ── */
    function updateChecklist() {
        if (!els.configChecklist) return;
        const issues = [], goods = [];
        const chId = (els.logChannelId && els.logChannelId.value.trim()) ||
            (els.logChannelSelect && els.logChannelSelect.value);
        if (!chId) issues.push("Log channel not set — bot won't send moderation logs.");
        else goods.push("Log channel configured.");
        if (!(els.enabled && els.enabled.checked)) issues.push("Moderation is currently disabled.");
        else goods.push("Moderation is enabled.");
        const rCount = readIdLines(els.exemptRoleIds).length;
        const cCount = readIdLines(els.exemptChannelIds).length;
        if (!rCount && !cCount) issues.push("No exemptions set — consider adding staff roles.");
        else goods.push(`Exemptions: ${rCount} role(s), ${cCount} channel(s).`);

        let html = "";
        issues.forEach(i => { html += `<div class="health-item warn"><i class="fas fa-triangle-exclamation"></i> ${escapeHtml(i)}</div>`; });
        goods.forEach(g => { html += `<div class="health-item ok"><i class="fas fa-check-circle"></i> ${escapeHtml(g)}</div>`; });
        els.configChecklist.innerHTML = html || '<div class="health-item ok"><i class="fas fa-check-circle"></i> Config looks good.</div>';
    }

    /* ── Preset application ── */
    function enforceMode(mode) {
        const learning = mode === "learning", aggressive = mode === "aggressive";
        const v = el => el && el.value;
        if (learning) {
            ["antiSpamAction","antiInviteAction","antiLinkAction","antiMentionAction","antiEveryoneAction","antiEmojiAction","antiLineAction","antiLongAction","antiAttachmentAction","antiCapsAction"].forEach(k => { if(els[k]) els[k].value = "warn"; });
            if (els.warnEscalationEnabled) els.warnEscalationEnabled.checked = false;
        } else if (aggressive) {
            if (els.antiSpamAction) els.antiSpamAction.value = "timeout";
            if (els.antiInviteAction) els.antiInviteAction.value = "delete_timeout";
            if (els.antiLinkAction) els.antiLinkAction.value = "delete_timeout";
            if (els.antiMentionAction) els.antiMentionAction.value = "delete_timeout";
            ["antiEveryoneAction","antiEmojiAction","antiLineAction","antiAttachmentAction"].forEach(k => { if(els[k]) els[k].value = "delete_timeout"; });
            if (els.warnEscalationEnabled) els.warnEscalationEnabled.checked = true;
            if (els.warnEscalationAction) els.warnEscalationAction.value = "timeout";
            if (els.warnMax) els.warnMax.value = 3;
        } else { // standard
            if (els.antiSpamAction) els.antiSpamAction.value = "timeout";
            if (els.antiInviteAction) els.antiInviteAction.value = "delete_warn";
            if (els.antiLinkAction) els.antiLinkAction.value = "delete_warn";
            if (els.antiMentionAction) els.antiMentionAction.value = "delete_timeout";
            ["antiEveryoneAction","antiEmojiAction","antiLineAction","antiAttachmentAction"].forEach(k => { if(els[k]) els[k].value = "delete_warn"; });
            if (els.antiLongAction) els.antiLongAction.value = "warn";
            if (els.antiCapsAction) els.antiCapsAction.value = "warn";
        }
    }

    function applyPresetProfile(profile, mode) {
        const starter = profile === "starter", high = profile === "high_security";
        if (els.antiSpamEnabled) els.antiSpamEnabled.checked = true;
        if (els.antiMentionEnabled) els.antiMentionEnabled.checked = !starter;
        if (els.antiEveryoneEnabled) els.antiEveryoneEnabled.checked = true;
        if (els.antiLinkEnabled) els.antiLinkEnabled.checked = high;
        if (els.antiInviteEnabled) els.antiInviteEnabled.checked = !starter;
        if (els.antiEmojiEnabled) els.antiEmojiEnabled.checked = high;
        if (els.newAccountGuardEnabled) els.newAccountGuardEnabled.checked = !starter;
        if (high && els.newAccountAgeMinutes) els.newAccountAgeMinutes.value = 1440;
        enforceMode(mode || "learning");
        updateChecklist();
    }

    /* ── Events ── */
    function bindEvents() {
        if (els.addServerBtn) els.addServerBtn.addEventListener("click", () => {
            const gid = String(els.newGuildId.value || "").trim();
            if (!gid || !/^\d{15,22}$/.test(gid)) { notify("Enter a valid Guild ID (15-22 digits)", "error"); return; }
            const list = mergeServers(loadServers(), [{ guild_id: gid, label: String(els.newGuildName.value || "").trim() || `Guild ${gid}` }]);
            saveServersLocal(list); renderServers();
            els.newGuildId.value = ""; els.newGuildName.value = "";
            notify(`Server ${gid} added`, "success");
        });

        if (els.removeServerBtn) els.removeServerBtn.addEventListener("click", () => {
            const gid = selectedGuildId();
            if (!gid) { notify("No server selected", "error"); return; }
            saveServersLocal(loadServers().filter(s => String(s.guild_id) !== gid));
            renderServers(); notify("Server removed", "info");
        });

        if (els.serverSelect) els.serverSelect.addEventListener("change", updateSelectedLabel);

        if (els.syncServersBtn) els.syncServersBtn.addEventListener("click", async () => {
            setBusy(els.syncServersBtn, true, "Syncing…");
            try {
                const r = await api("/api/discord/servers");
                const incoming = (r && r.data && r.data.servers) || [];
                if (incoming.length) {
                    saveServersLocal(mergeServers(loadServers(), incoming));
                    renderServers();
                    notify(`Synced — ${incoming.length} server(s) found`, "success");
                } else {
                    notify("No servers returned from live bot", "info");
                }
            } catch (err) { notify(`Sync failed: ${err.message}`, "error"); }
            finally { setBusy(els.syncServersBtn, false); }
        });

        if (els.testConnectionBtn) els.testConnectionBtn.addEventListener("click", async () => {
            try { await api("/api/discord/servers"); setConnectionStatus("Connected", true); notify("Connection OK", "success"); }
            catch (err) { setConnectionStatus("Failed", false); notify(`Connection failed: ${err.message}`, "error"); }
        });

        if (els.loadConfigBtn) els.loadConfigBtn.addEventListener("click", loadConfig);
        if (els.refreshConfigBtn) els.refreshConfigBtn.addEventListener("click", loadConfig);

        // Per-section saves
        if (els.saveLogBtn) els.saveLogBtn.addEventListener("click", () => {
            const gid = selectedGuildId();
            if (!gid) { notify("Select a server first", "error"); return; }
            sectionSave(gid, buildLogPatch(), els.saveLogBtn, els.logSaveStatus, "Log channel & switches");
        });

        if (els.saveExemptionsBtn) els.saveExemptionsBtn.addEventListener("click", () => {
            const gid = selectedGuildId();
            if (!gid) { notify("Select a server first", "error"); return; }
            sectionSave(gid, buildExemptionsPatch(), els.saveExemptionsBtn, els.exemptSaveStatus, "Exemptions");
        });

        if (els.saveFiltersBtn) els.saveFiltersBtn.addEventListener("click", () => {
            const gid = selectedGuildId();
            if (!gid) { notify("Select a server first", "error"); return; }
            sectionSave(gid, buildFiltersPatch(), els.saveFiltersBtn, els.filterSaveStatus, "Filter settings");
        });

        if (els.saveJoinGateBtn) els.saveJoinGateBtn.addEventListener("click", () => {
            const gid = selectedGuildId();
            if (!gid) { notify("Select a server first", "error"); return; }
            sectionSave(gid, buildJoinGatePatch(), els.saveJoinGateBtn, els.joinGateSaveStatus, "Join-Gate");
        });

        // Sync log channel select → input
        if (els.logChannelSelect) els.logChannelSelect.addEventListener("change", () => {
            if (els.logChannelSelect.value && els.logChannelId) els.logChannelId.value = els.logChannelSelect.value;
            updateChecklist();
        });
        if (els.logChannelId) els.logChannelId.addEventListener("input", updateChecklist);
        if (els.enabled) els.enabled.addEventListener("change", updateChecklist);
        if (els.exemptRoleIds) els.exemptRoleIds.addEventListener("input", updateChecklist);
        if (els.exemptChannelIds) els.exemptChannelIds.addEventListener("input", updateChecklist);

        // Role exemption helpers
        if (els.refreshRolesBtn) els.refreshRolesBtn.addEventListener("click", fetchRoles);
        if (els.applySelectedRolesBtn) els.applySelectedRolesBtn.addEventListener("click", () => {
            const selected = Array.from(els.serverRolesSelect.selectedOptions).map(o => o.value).filter(Boolean);
            if (els.exemptRoleIds) {
                const existing = new Set(readIdLines(els.exemptRoleIds));
                selected.forEach(id => existing.add(id));
                els.exemptRoleIds.value = Array.from(existing).join("\n");
            }
            updateChecklist();
            notify(`${selected.length} role(s) added to exemptions`, "success");
        });

        // Join-gate channel/role from dropdowns
        if (els.useSelectedChannelBtn) els.useSelectedChannelBtn.addEventListener("click", () => {
            if (els.joinGateChannelSelect && els.joinGateChannelSelect.value && els.joinGateChannelId)
                els.joinGateChannelId.value = els.joinGateChannelSelect.value;
        });
        if (els.useSelectedRoleBtn) els.useSelectedRoleBtn.addEventListener("click", () => {
            if (els.joinGateRoleSelect && els.joinGateRoleSelect.value && els.joinGateRoleId)
                els.joinGateRoleId.value = els.joinGateRoleSelect.value;
        });

        // Send verification preview
        if (els.applyVerificationBtn) els.applyVerificationBtn.addEventListener("click", async () => {
            const gid = selectedGuildId();
            if (!gid) { notify("Select a server first", "error"); return; }
            const chId = (els.joinGateChannelId && els.joinGateChannelId.value) ||
                (els.joinGateChannelSelect && els.joinGateChannelSelect.value) || null;
            const rId = (els.joinGateRoleId && els.joinGateRoleId.value) ||
                (els.joinGateRoleSelect && els.joinGateRoleSelect.value) || null;
            setBusy(els.applyVerificationBtn, true, "Sending…");
            try {
                await api(`/api/discord/moderation/send_verification/${encodeURIComponent(gid)}`, {
                    method: "POST", body: JSON.stringify({ channel_id: chId || undefined, role_id: rId || undefined })
                });
                notify("Verification message sent!", "success");
            } catch (err) { notify(`Send failed: ${err.message}`, "error"); }
            finally { setBusy(els.applyVerificationBtn, false); }
        });

        // Guided + presets
        if (els.applyGuidedBtn) els.applyGuidedBtn.addEventListener("click", () => {
            applyPresetProfile(els.guidedMode && els.guidedMode.value, els.enforcementMode && els.enforcementMode.value);
            notify("Profile applied — review settings then save each section", "info");
        });

        function applyPreset(relaxed) {
            if (relaxed) {
                if (els.antiSpamLimit) els.antiSpamLimit.value = 10;
                if (els.mentionLimit) els.mentionLimit.value = 8;
                if (els.warnMax) els.warnMax.value = 5;
                enforceMode("learning");
            } else {
                if (els.antiSpamLimit) els.antiSpamLimit.value = 5;
                if (els.mentionLimit) els.mentionLimit.value = 4;
                if (els.warnMax) els.warnMax.value = 3;
                enforceMode("standard");
            }
        }

        if (els.presetRelaxedBtn) els.presetRelaxedBtn.addEventListener("click", () => { applyPreset(true); notify("Relaxed preset applied", "info"); });
        if (els.presetBalancedBtn) els.presetBalancedBtn.addEventListener("click", () => { applyPreset(false); notify("Balanced preset applied", "info"); });
        if (els.presetStrictBtn) els.presetStrictBtn.addEventListener("click", () => {
            if (els.antiSpamLimit) els.antiSpamLimit.value = 3;
            if (els.mentionLimit) els.mentionLimit.value = 2;
            if (els.warnMax) els.warnMax.value = 2;
            enforceMode("aggressive");
            notify("Strict preset applied", "info");
        });

        // Advanced toggle
        if (els.advancedToggle && els.advancedSection) {
            els.advancedToggle.addEventListener("click", () => {
                advancedVisible = !advancedVisible;
                els.advancedSection.classList.toggle("open", advancedVisible);
                els.advancedToggle.classList.toggle("open", advancedVisible);
                if (els.advancedStateLabel) els.advancedStateLabel.textContent = advancedVisible ? "(shown)" : "(hidden)";
            });
        }

        // Cases and warnings
        if (els.loadCasesBtn) els.loadCasesBtn.addEventListener("click", async () => {
            const gid = selectedGuildId();
            if (!gid) { notify("Select a server first", "error"); return; }
            setBusy(els.loadCasesBtn, true, "Loading…");
            try {
                const limit = numOrDef(els.casesLimit && els.casesLimit.value, 100, 1, 500);
                const res = await api(`/api/discord/moderation/cases/${encodeURIComponent(gid)}?limit=${limit}`);
                const cases = (res && res.data && res.data.cases) || [];
                if (!els.casesBody) return;
                els.casesBody.innerHTML = cases.length ? cases.map(c => `
                    <tr>
                        <td>#${escapeHtml(String(c.case_id||""))}</td>
                        <td><span class="pill pill-${escapeHtml(c.action||"warn")}">${escapeHtml(c.action||"warn")}</span></td>
                        <td class="mono" style="font-size:0.8rem;">${escapeHtml(String(c.user_id||""))}</td>
                        <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(c.rule||"")}">${escapeHtml(c.rule||"—")}</td>
                    </tr>`).join("") : '<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:16px;">No cases found</td></tr>';
            } catch (err) { notify(`Cases failed: ${err.message}`, "error"); }
            finally { setBusy(els.loadCasesBtn, false); }
        });

        if (els.loadWarningsBtn) els.loadWarningsBtn.addEventListener("click", async () => {
            const gid = selectedGuildId();
            const uid = String(els.warningsUserId && els.warningsUserId.value || "").trim();
            if (!gid || !uid) { notify("Select a server and enter a User ID", "error"); return; }
            try {
                const res = await api(`/api/discord/moderation/warnings/${encodeURIComponent(gid)}/${encodeURIComponent(uid)}`);
                const warns = (res && res.data && res.data.warnings) || [];
                if (els.warningsList) {
                    els.warningsList.innerHTML = warns.length ? warns.map(w => `
                        <div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:0.84rem;">
                            <div style="color:var(--warn);font-weight:600;">${escapeHtml(w.reason||"No reason")}</div>
                            <div style="color:var(--text-muted);font-size:0.77rem;margin-top:2px;">${escapeHtml(w.timestamp||"")}</div>
                        </div>`).join("") : '<div style="color:var(--text-muted);padding:10px 0;font-size:0.84rem;">No warnings found</div>';
                }
                notify(`${warns.length} warning(s) loaded`, "success");
            } catch (err) { notify(`Warnings failed: ${err.message}`, "error"); }
        });

        if (els.clearWarningsBtn) els.clearWarningsBtn.addEventListener("click", async () => {
            const gid = selectedGuildId();
            const uid = String(els.warningsUserId && els.warningsUserId.value || "").trim();
            if (!gid || !uid) { notify("Select a server and enter a User ID", "error"); return; }
            if (!confirm(`Clear all warnings for user ${uid}?`)) return;
            try {
                const res = await api(`/api/discord/moderation/warnings/${encodeURIComponent(gid)}/${encodeURIComponent(uid)}`, { method: "DELETE" });
                if (els.warningsList) els.warningsList.innerHTML = '<div style="color:var(--text-muted);padding:10px 0;font-size:0.84rem;">Warnings cleared</div>';
                notify("Warnings cleared", "success");
            } catch (err) { notify(`Clear failed: ${err.message}`, "error"); }
        });

        if (els.unquarantineBtn) els.unquarantineBtn.addEventListener("click", async () => {
            const gid = selectedGuildId();
            const uid = String(els.warningsUserId && els.warningsUserId.value || "").trim();
            if (!gid || !uid) { notify("Select a server and enter a User ID", "error"); return; }
            if (!confirm(`Restore roles for user ${uid}? This will remove quarantine role and attempt to restore saved roles.`)) return;
            setBusy(els.unquarantineBtn, true, "Restoring…");
            try {
                await api(`/api/discord/moderation/unquarantine/${encodeURIComponent(gid)}/${encodeURIComponent(uid)}`, { method: "POST" });
                notify("Unquarantine requested (bot will process shortly)", "success");
            } catch (err) { notify(`Unquarantine failed: ${err.message}`, "error"); }
            finally { setBusy(els.unquarantineBtn, false); }
        });
    }

    /* ── Init ── */
    function init() {
        getAdminId();
        renderServers();
        bindEvents();
        updateChecklist();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
