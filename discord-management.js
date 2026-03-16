/* Discord dashboard management client */

(function () {
    const API_BASE = (window.DASHBOARDCONFIG && window.DASHBOARDCONFIG.APIURL) || "";
    const TOKEN_KEY = (window.DASHBOARDCONFIG && window.DASHBOARDCONFIG.DISCORD_ADMIN_TOKEN_STORAGE_KEY) || "discord_admin_token";
    const SERVERS_KEY = "discord_managed_servers";
    const SELECTED_SERVER_KEY = "discord_selected_server";

    const els = {
        token: document.getElementById("adminToken"),
        tokenStatus: document.getElementById("tokenStatus"),
        serverSelect: document.getElementById("serverSelect"),
        newGuildId: document.getElementById("newGuildId"),
        newGuildName: document.getElementById("newGuildName"),
        enabled: document.getElementById("enabled"),
        exemptAdmins: document.getElementById("exemptAdmins"),
        logChannelId: document.getElementById("logChannelId"),
        antiLinkEnabled: document.getElementById("antiLinkEnabled"),
        antiInviteEnabled: document.getElementById("antiInviteEnabled"),
        antiSpamEnabled: document.getElementById("antiSpamEnabled"),
        antiMentionEnabled: document.getElementById("antiMentionEnabled"),
        antiEveryoneEnabled: document.getElementById("antiEveryoneEnabled"),
        antiEmojiEnabled: document.getElementById("antiEmojiEnabled"),
        antiAttachmentEnabled: document.getElementById("antiAttachmentEnabled"),
        antiLineEnabled: document.getElementById("antiLineEnabled"),
        antiLongEnabled: document.getElementById("antiLongEnabled"),
        antiCapsEnabled: document.getElementById("antiCapsEnabled"),
        newAccountGuardEnabled: document.getElementById("newAccountGuardEnabled"),
        warnEscalationEnabled: document.getElementById("warnEscalationEnabled"),
        raidModeEnabled: document.getElementById("raidModeEnabled"),
        antiSpamLimit: document.getElementById("antiSpamLimit"),
        antiSpamWindow: document.getElementById("antiSpamWindow"),
        duplicateLimit: document.getElementById("duplicateLimit"),
        spamTimeoutSeconds: document.getElementById("spamTimeoutSeconds"),
        antiSpamAction: document.getElementById("antiSpamAction"),
        mentionLimit: document.getElementById("mentionLimit"),
        mentionTimeoutSeconds: document.getElementById("mentionTimeoutSeconds"),
        antiMentionAction: document.getElementById("antiMentionAction"),
        antiLinkAction: document.getElementById("antiLinkAction"),
        antiInviteAction: document.getElementById("antiInviteAction"),
        allowDomains: document.getElementById("allowDomains"),
        exemptRoleIds: document.getElementById("exemptRoleIds"),
        exemptChannelIds: document.getElementById("exemptChannelIds"),
        emojiLimit: document.getElementById("emojiLimit"),
        antiEmojiAction: document.getElementById("antiEmojiAction"),
        lineLimit: document.getElementById("lineLimit"),
        antiLineAction: document.getElementById("antiLineAction"),
        charLimit: document.getElementById("charLimit"),
        antiLongAction: document.getElementById("antiLongAction"),
        capsRatio: document.getElementById("capsRatio"),
        capsMinLength: document.getElementById("capsMinLength"),
        antiCapsAction: document.getElementById("antiCapsAction"),
        attachmentLimit: document.getElementById("attachmentLimit"),
        antiAttachmentAction: document.getElementById("antiAttachmentAction"),
        everyoneMentionLimit: document.getElementById("everyoneMentionLimit"),
        antiEveryoneAction: document.getElementById("antiEveryoneAction"),
        newAccountAgeMinutes: document.getElementById("newAccountAgeMinutes"),
        newAccountAction: document.getElementById("newAccountAction"),
        warnMax: document.getElementById("warnMax"),
        warnEscalationAction: document.getElementById("warnEscalationAction"),
        warnEscalationTimeoutSeconds: document.getElementById("warnEscalationTimeoutSeconds"),
        raidQuarantineRoleId: document.getElementById("raidQuarantineRoleId"),
        bannedWords: document.getElementById("bannedWords"),
        casesLimit: document.getElementById("casesLimit"),
        casesBody: document.getElementById("casesBody"),
        warningsUserId: document.getElementById("warningsUserId"),
        warningsList: document.getElementById("warningsList"),
        saveTokenBtn: document.getElementById("saveTokenBtn"),
        clearTokenBtn: document.getElementById("clearTokenBtn"),
        addServerBtn: document.getElementById("addServerBtn"),
        removeServerBtn: document.getElementById("removeServerBtn"),
        loadConfigBtn: document.getElementById("loadConfigBtn"),
        saveConfigBtn: document.getElementById("saveConfigBtn"),
        refreshConfigBtn: document.getElementById("refreshConfigBtn"),
        loadCasesBtn: document.getElementById("loadCasesBtn"),
        loadWarningsBtn: document.getElementById("loadWarningsBtn"),
        clearWarningsBtn: document.getElementById("clearWarningsBtn")
        ,
        toastWrap: document.getElementById("toastWrap"),
        connectionStatus: document.getElementById("connectionStatus"),
        selectedServerLabel: document.getElementById("selectedServerLabel"),
        lastActionLabel: document.getElementById("lastActionLabel"),
        testConnectionBtn: document.getElementById("testConnectionBtn"),
        presetRelaxedBtn: document.getElementById("presetRelaxedBtn"),
        presetBalancedBtn: document.getElementById("presetBalancedBtn"),
        presetStrictBtn: document.getElementById("presetStrictBtn"),
        guidedMode: document.getElementById("guidedMode"),
        enforcementMode: document.getElementById("enforcementMode"),
        syncServersBtn: document.getElementById("syncServersBtn"),
        applyGuidedBtn: document.getElementById("applyGuidedBtn"),
        toggleAdvancedBtn: document.getElementById("toggleAdvancedBtn"),
        advancedStateLabel: document.getElementById("advancedStateLabel"),
        moderationSettingsBlock: document.getElementById("moderationSettingsBlock"),
        configChecklist: document.getElementById("configChecklist")
    };

    let advancedVisible = false;
    let serverDiscoveryAttempts = 0;

    function setLastAction(actionText) {
        if (els.lastActionLabel) {
            els.lastActionLabel.textContent = actionText;
        }
    }

    function setConnectionStatus(text, ok) {
        if (!els.connectionStatus) {
            return;
        }
        els.connectionStatus.textContent = text;
        els.connectionStatus.style.color = ok ? "#166534" : "#991b1b";
    }

    function notify(msg, type) {
        if (!els.toastWrap) {
            window.alert(msg);
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast ${type || ""}`.trim();
        toast.textContent = msg;
        els.toastWrap.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2600);
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || "";
    }

    function setTokenStatus() {
        const hasToken = !!getToken();
        if (hasToken) {
            els.tokenStatus.classList.add("pill-success");
            els.tokenStatus.classList.remove("pill-danger");
            els.tokenStatus.innerHTML = '<i class="fas fa-circle" style="color:#16a34a"></i><span>Token saved</span>';
        } else {
            els.tokenStatus.classList.remove("pill-success");
            els.tokenStatus.classList.add("pill-danger");
            els.tokenStatus.innerHTML = '<i class="fas fa-circle" style="color:#dc2626"></i><span>No token saved</span>';
        }
    }

    function loadServers() {
        try {
            const data = JSON.parse(localStorage.getItem(SERVERS_KEY) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (_) {
            return [];
        }
    }

    function saveServers(list) {
        localStorage.setItem(SERVERS_KEY, JSON.stringify(list));
    }

    function mergeServers(existing, incoming) {
        const merged = [];
        const seen = new Set();

        (existing || []).forEach((srv) => {
            const gid = String((srv && srv.guild_id) || "").trim();
            if (!gid || seen.has(gid)) {
                return;
            }
            seen.add(gid);
            merged.push({ guild_id: gid, label: String(srv.label || `Guild ${gid}`) });
        });

        (incoming || []).forEach((srv) => {
            const gid = String((srv && srv.guild_id) || "").trim();
            if (!gid || seen.has(gid)) {
                return;
            }
            seen.add(gid);
            merged.push({ guild_id: gid, label: String(srv.label || `Guild ${gid}`) });
        });

        return merged;
    }

    function renderServers() {
        const list = loadServers();
        els.serverSelect.innerHTML = "";
        if (!list.length) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "No servers added";
            els.serverSelect.appendChild(opt);
            return;
        }

        const storedSelected = localStorage.getItem(SELECTED_SERVER_KEY) || "";
        list.forEach((s) => {
            const opt = document.createElement("option");
            opt.value = String(s.guild_id);
            opt.textContent = `${s.label || "Guild"} (${s.guild_id})`;
            els.serverSelect.appendChild(opt);
        });

        if (storedSelected && list.some((s) => String(s.guild_id) === storedSelected)) {
            els.serverSelect.value = storedSelected;
        }
        updateSelectedServerLabel();
    }

    function selectedGuildId() {
        return String(els.serverSelect.value || "").trim();
    }

    function updateSelectedServerLabel() {
        const gid = selectedGuildId();
        if (els.selectedServerLabel) {
            els.selectedServerLabel.textContent = gid || "None";
        }
        if (gid) {
            localStorage.setItem(SELECTED_SERVER_KEY, gid);
        }
    }

    function setBusy(button, busy, busyText) {
        if (!button) {
            return;
        }
        if (busy) {
            button.dataset.originalText = button.textContent;
            button.textContent = busyText || "Working...";
            button.disabled = true;
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    }

    async function api(path, opts) {
        const token = getToken();
        if (!token) {
            throw new Error("Admin token is missing");
        }
        const response = await fetch(`${API_BASE}${path}`, {
            ...(opts || {}),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                ...((opts && opts.headers) || {})
            }
        });

        let payload = null;
        try {
            payload = await response.json();
        } catch (_) {
            payload = null;
        }

        if (!response.ok) {
            const detail = payload && (payload.detail || payload.message) ? (payload.detail || payload.message) : `HTTP ${response.status}`;
            throw new Error(detail);
        }

        setLastAction(`API ${opts && opts.method ? opts.method : "GET"} ${path}`);

        return payload;
    }

    function applyConfig(config) {
        const features = (config && config.features) || {};
        els.enabled.checked = !!config.enabled;
        els.exemptAdmins.checked = config.exempt_admins !== false;
        els.logChannelId.value = config.log_channel_id || "";
        els.exemptRoleIds.value = (config.exempt_role_ids || []).join("\n");
        els.exemptChannelIds.value = (config.exempt_channel_ids || []).join("\n");
        els.antiLinkEnabled.checked = !!(features.anti_link && features.anti_link.enabled);
        els.antiLinkAction.value = (features.anti_link && features.anti_link.action) || "delete_warn";
        els.allowDomains.value = ((features.anti_link && features.anti_link.allow_domains) || []).join("\n");
        els.antiInviteEnabled.checked = !!(features.anti_invite && features.anti_invite.enabled);
        els.antiInviteAction.value = (features.anti_invite && features.anti_invite.action) || "delete_warn";
        els.antiSpamEnabled.checked = !!(features.anti_spam && features.anti_spam.enabled);
        els.antiSpamAction.value = (features.anti_spam && features.anti_spam.action) || "timeout";
        els.antiSpamLimit.value = (features.anti_spam && features.anti_spam.message_limit) || 6;
        els.antiSpamWindow.value = (features.anti_spam && features.anti_spam.window_seconds) || 10;
        els.duplicateLimit.value = (features.anti_spam && features.anti_spam.duplicate_limit) || 4;
        els.spamTimeoutSeconds.value = (features.anti_spam && features.anti_spam.timeout_seconds) || 600;
        els.antiMentionEnabled.checked = !!(features.anti_mention_spam && features.anti_mention_spam.enabled);
        els.mentionLimit.value = (features.anti_mention_spam && features.anti_mention_spam.max_mentions) || 5;
        els.mentionTimeoutSeconds.value = (features.anti_mention_spam && features.anti_mention_spam.timeout_seconds) || 600;
        els.antiMentionAction.value = (features.anti_mention_spam && features.anti_mention_spam.action) || "delete_timeout";
        els.antiEveryoneEnabled.checked = !!(features.anti_everyone_mention && features.anti_everyone_mention.enabled);
        els.everyoneMentionLimit.value = (features.anti_everyone_mention && features.anti_everyone_mention.max_mentions) || 0;
        els.antiEveryoneAction.value = (features.anti_everyone_mention && features.anti_everyone_mention.action) || "delete_warn";
        els.antiEmojiEnabled.checked = !!(features.anti_emoji_spam && features.anti_emoji_spam.enabled);
        els.emojiLimit.value = (features.anti_emoji_spam && features.anti_emoji_spam.max_emojis) || 14;
        els.antiEmojiAction.value = (features.anti_emoji_spam && features.anti_emoji_spam.action) || "delete_warn";
        els.antiLineEnabled.checked = !!(features.anti_line_spam && features.anti_line_spam.enabled);
        els.lineLimit.value = (features.anti_line_spam && features.anti_line_spam.max_lines) || 12;
        els.antiLineAction.value = (features.anti_line_spam && features.anti_line_spam.action) || "delete_warn";
        els.antiLongEnabled.checked = !!(features.anti_long_message && features.anti_long_message.enabled);
        els.charLimit.value = (features.anti_long_message && features.anti_long_message.max_chars) || 1400;
        els.antiLongAction.value = (features.anti_long_message && features.anti_long_message.action) || "warn";
        els.antiAttachmentEnabled.checked = !!(features.anti_attachment_spam && features.anti_attachment_spam.enabled);
        els.attachmentLimit.value = (features.anti_attachment_spam && features.anti_attachment_spam.max_attachments) || 3;
        els.antiAttachmentAction.value = (features.anti_attachment_spam && features.anti_attachment_spam.action) || "delete_warn";
        els.antiCapsEnabled.checked = !!(features.anti_caps && features.anti_caps.enabled);
        els.capsRatio.value = (features.anti_caps && features.anti_caps.ratio) || 0.8;
        els.capsMinLength.value = (features.anti_caps && features.anti_caps.min_length) || 14;
        els.antiCapsAction.value = (features.anti_caps && features.anti_caps.action) || "warn";
        els.newAccountGuardEnabled.checked = !!(features.new_account_guard && features.new_account_guard.enabled);
        els.newAccountAgeMinutes.value = (features.new_account_guard && features.new_account_guard.min_account_age_minutes) || 60;
        els.newAccountAction.value = (features.new_account_guard && features.new_account_guard.action) || "log";
        els.warnEscalationEnabled.checked = !!(features.warn_escalation && features.warn_escalation.enabled);
        els.warnMax.value = (features.warn_escalation && features.warn_escalation.max_warns) || 3;
        els.warnEscalationAction.value = (features.warn_escalation && features.warn_escalation.action) || "timeout";
        els.warnEscalationTimeoutSeconds.value = (features.warn_escalation && features.warn_escalation.timeout_seconds) || 1800;
        els.raidModeEnabled.checked = !!(features.raid_mode && features.raid_mode.enabled);
        els.raidQuarantineRoleId.value = (features.raid_mode && features.raid_mode.quarantine_role_id) || "";
        const words = (features.banned_words && features.banned_words.words) || [];
        els.bannedWords.value = words.join("\n");
        updateChecklist();
    }

    function buildConfigPatch() {
        const words = els.bannedWords.value
            .split("\n")
            .map((w) => w.trim())
            .filter(Boolean);
        const allowDomains = els.allowDomains.value
            .split("\n")
            .map((w) => w.trim().toLowerCase())
            .filter(Boolean);
        const exemptRoleIds = els.exemptRoleIds.value
            .split("\n")
            .map((v) => Number(String(v).trim()))
            .filter((v) => Number.isFinite(v) && v > 0);
        const exemptChannelIds = els.exemptChannelIds.value
            .split("\n")
            .map((v) => Number(String(v).trim()))
            .filter((v) => Number.isFinite(v) && v > 0);

        return {
            enabled: !!els.enabled.checked,
            exempt_admins: !!els.exemptAdmins.checked,
            log_channel_id: els.logChannelId.value ? Number(els.logChannelId.value) : null,
            exempt_role_ids: exemptRoleIds,
            exempt_channel_ids: exemptChannelIds,
            features: {
                anti_link: {
                    enabled: !!els.antiLinkEnabled.checked,
                    action: els.antiLinkAction.value,
                    allow_domains: allowDomains,
                },
                anti_invite: {
                    enabled: !!els.antiInviteEnabled.checked,
                    action: els.antiInviteAction.value,
                },
                anti_spam: {
                    enabled: !!els.antiSpamEnabled.checked,
                    action: els.antiSpamAction.value,
                    message_limit: Number(els.antiSpamLimit.value || 6),
                    window_seconds: Number(els.antiSpamWindow.value || 10),
                    duplicate_limit: Number(els.duplicateLimit.value || 4),
                    timeout_seconds: Number(els.spamTimeoutSeconds.value || 600),
                },
                anti_mention_spam: {
                    enabled: !!els.antiMentionEnabled.checked,
                    max_mentions: Number(els.mentionLimit.value || 5),
                    timeout_seconds: Number(els.mentionTimeoutSeconds.value || 600),
                    action: els.antiMentionAction.value,
                },
                anti_everyone_mention: {
                    enabled: !!els.antiEveryoneEnabled.checked,
                    max_mentions: Number(els.everyoneMentionLimit.value || 0),
                    action: els.antiEveryoneAction.value,
                },
                anti_emoji_spam: {
                    enabled: !!els.antiEmojiEnabled.checked,
                    max_emojis: Number(els.emojiLimit.value || 14),
                    action: els.antiEmojiAction.value,
                },
                anti_line_spam: {
                    enabled: !!els.antiLineEnabled.checked,
                    max_lines: Number(els.lineLimit.value || 12),
                    action: els.antiLineAction.value,
                },
                anti_long_message: {
                    enabled: !!els.antiLongEnabled.checked,
                    max_chars: Number(els.charLimit.value || 1400),
                    action: els.antiLongAction.value,
                },
                anti_attachment_spam: {
                    enabled: !!els.antiAttachmentEnabled.checked,
                    max_attachments: Number(els.attachmentLimit.value || 3),
                    action: els.antiAttachmentAction.value,
                },
                anti_caps: {
                    enabled: !!els.antiCapsEnabled.checked,
                    ratio: Number(els.capsRatio.value || 0.8),
                    min_length: Number(els.capsMinLength.value || 14),
                    action: els.antiCapsAction.value,
                },
                new_account_guard: {
                    enabled: !!els.newAccountGuardEnabled.checked,
                    min_account_age_minutes: Number(els.newAccountAgeMinutes.value || 60),
                    action: els.newAccountAction.value,
                },
                warn_escalation: {
                    enabled: !!els.warnEscalationEnabled.checked,
                    max_warns: Number(els.warnMax.value || 3),
                    action: els.warnEscalationAction.value,
                    timeout_seconds: Number(els.warnEscalationTimeoutSeconds.value || 1800),
                },
                raid_mode: {
                    enabled: !!els.raidModeEnabled.checked,
                    quarantine_role_id: els.raidQuarantineRoleId.value ? Number(els.raidQuarantineRoleId.value) : null,
                },
                banned_words: {
                    words: words,
                    enabled: true
                }
            }
        };
    }

    function enforceMode(mode) {
        if (mode === "learning") {
            els.antiSpamAction.value = "warn";
            els.antiInviteAction.value = "delete_warn";
            els.antiLinkAction.value = "delete_warn";
            els.antiMentionAction.value = "warn";
            els.antiEveryoneAction.value = "warn";
            els.antiEmojiAction.value = "warn";
            els.antiLineAction.value = "warn";
            els.antiLongAction.value = "warn";
            els.antiAttachmentAction.value = "warn";
            els.antiCapsAction.value = "warn";
            els.warnEscalationEnabled.checked = false;
            return;
        }

        if (mode === "aggressive") {
            els.antiSpamAction.value = "timeout";
            els.antiInviteAction.value = "delete_timeout";
            els.antiLinkAction.value = "delete_timeout";
            els.antiMentionAction.value = "delete_timeout";
            els.antiEveryoneAction.value = "delete_timeout";
            els.antiEmojiAction.value = "delete_timeout";
            els.antiLineAction.value = "delete_timeout";
            els.antiLongAction.value = "delete_warn";
            els.antiAttachmentAction.value = "delete_timeout";
            els.antiCapsAction.value = "delete_warn";
            els.warnEscalationEnabled.checked = true;
            els.warnEscalationAction.value = "timeout";
            els.warnMax.value = 3;
            return;
        }

        els.antiSpamAction.value = "timeout";
        els.antiInviteAction.value = "delete_warn";
        els.antiLinkAction.value = "delete_warn";
        els.antiMentionAction.value = "delete_timeout";
        els.antiEveryoneAction.value = "delete_warn";
        els.antiEmojiAction.value = "delete_warn";
        els.antiLineAction.value = "delete_warn";
        els.antiLongAction.value = "warn";
        els.antiAttachmentAction.value = "delete_warn";
        els.antiCapsAction.value = "warn";
    }

    function buildChecklistItems() {
        const issues = [];
        const goods = [];

        if (!els.logChannelId.value.trim()) {
            issues.push("Log channel is empty. Set it so moderators can audit actions.");
        } else {
            goods.push("Log channel configured.");
        }

        if (!els.enabled.checked) {
            issues.push("Moderation is currently disabled.");
        } else {
            goods.push("Moderation is enabled.");
        }

        const roleCount = els.exemptRoleIds.value.split("\n").map((v) => v.trim()).filter(Boolean).length;
        const channelCount = els.exemptChannelIds.value.split("\n").map((v) => v.trim()).filter(Boolean).length;
        if (roleCount === 0 && channelCount === 0) {
            issues.push("No exemptions set. Add staff roles/channels to reduce false positives.");
        } else {
            goods.push(`Exemptions configured (${roleCount} role IDs, ${channelCount} channel IDs).`);
        }

        if (!els.exemptAdmins.checked) {
            issues.push("Admin exemption is off. Keep this off only if you intentionally moderate admins.");
        } else {
            goods.push("Admins are exempted (recommended).");
        }

        return { issues, goods };
    }

    function updateChecklist() {
        if (!els.configChecklist) {
            return;
        }
        const report = buildChecklistItems();
        const parts = ['<div class="checklist-title">Configuration Health Check</div>'];
        if (!report.issues.length) {
            parts.push('<div class="checklist-item good">All essential checks passed.</div>');
        } else {
            report.issues.forEach((item) => {
                parts.push(`<div class="checklist-item warn">${escapeHtml(item)}</div>`);
            });
        }
        report.goods.forEach((item) => {
            parts.push(`<div class="checklist-item good">${escapeHtml(item)}</div>`);
        });
        els.configChecklist.innerHTML = parts.join("");
    }

    async function loadConfig() {
        const gid = selectedGuildId();
        if (!gid) {
            notify("Select a server first", "error");
            return;
        }
        setBusy(els.loadConfigBtn, true, "Loading...");
        try {
            const res = await api(`/api/discord/moderation/config/${encodeURIComponent(gid)}`);
            applyConfig(res.data || {});
            notify("Moderation config loaded", "success");
            setConnectionStatus("Connected", true);
        } catch (err) {
            notify(`Load config failed: ${err.message}`, "error");
            setConnectionStatus("Request failed", false);
        } finally {
            setBusy(els.loadConfigBtn, false);
        }
    }

    async function saveConfig() {
        const gid = selectedGuildId();
        if (!gid) {
            notify("Select a server first", "error");
            return;
        }
        const checklist = buildChecklistItems();
        if (checklist.issues.length > 0) {
            const proceed = window.confirm(
                "Some setup checks are incomplete:\n\n- " + checklist.issues.join("\n- ") + "\n\nDo you want to save anyway?"
            );
            if (!proceed) {
                return;
            }
        }
        setBusy(els.saveConfigBtn, true, "Saving...");
        try {
            await api(`/api/discord/moderation/config/${encodeURIComponent(gid)}`, {
                method: "PATCH",
                body: JSON.stringify(buildConfigPatch())
            });
            notify("Moderation config saved", "success");
            setConnectionStatus("Connected", true);
        } catch (err) {
            notify(`Save config failed: ${err.message}`, "error");
            setConnectionStatus("Request failed", false);
        } finally {
            setBusy(els.saveConfigBtn, false);
        }
    }

    function renderCases(cases) {
        els.casesBody.innerHTML = "";
        if (!cases.length) {
            const row = document.createElement("tr");
            row.innerHTML = '<td colspan="4">No cases found</td>';
            els.casesBody.appendChild(row);
            return;
        }
        cases.slice().reverse().forEach((c) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>#${c.case_id || "-"}</td>
                <td>${escapeHtml(String(c.action || "-"))}</td>
                <td class="mono">${escapeHtml(String(c.user_id || "-"))}</td>
                <td>${escapeHtml(String(c.rule || "-"))}</td>
                <td>${c.automated ? "Yes" : "No"}</td>
            `;
            els.casesBody.appendChild(row);
        });
    }

    async function loadCases() {
        const gid = selectedGuildId();
        if (!gid) {
            notify("Select a server first", "error");
            return;
        }
        const limit = Number(els.casesLimit.value || 100);
        setBusy(els.loadCasesBtn, true, "Loading...");
        try {
            const res = await api(`/api/discord/moderation/cases/${encodeURIComponent(gid)}?limit=${encodeURIComponent(limit)}`);
            const list = (res.data && res.data.cases) || [];
            renderCases(list);
            notify(`Loaded ${list.length} case(s)`, "success");
        } catch (err) {
            notify(`Load cases failed: ${err.message}`, "error");
        } finally {
            setBusy(els.loadCasesBtn, false);
        }
    }

    function renderWarnings(warnings) {
        if (!warnings.length) {
            els.warningsList.innerHTML = '<p class="muted">No warnings found.</p>';
            return;
        }
        els.warningsList.innerHTML = warnings
            .map((w, idx) => `<div class="warnings-item"><strong>${idx + 1}.</strong> ${escapeHtml(String(w.reason || "No reason"))}</div>`)
            .join("");
    }

    async function loadWarnings() {
        const gid = selectedGuildId();
        const uid = String(els.warningsUserId.value || "").trim();
        if (!gid || !uid) {
            notify("Select a server and enter user ID", "error");
            return;
        }
        setBusy(els.loadWarningsBtn, true, "Loading...");
        try {
            const res = await api(`/api/discord/moderation/warnings/${encodeURIComponent(gid)}/${encodeURIComponent(uid)}`);
            const warningList = (res.data && res.data.warnings) || [];
            renderWarnings(warningList);
            notify(`Loaded ${warningList.length} warning(s)`, "success");
        } catch (err) {
            notify(`Load warnings failed: ${err.message}`, "error");
        } finally {
            setBusy(els.loadWarningsBtn, false);
        }
    }

    async function clearWarnings() {
        const gid = selectedGuildId();
        const uid = String(els.warningsUserId.value || "").trim();
        if (!gid || !uid) {
            notify("Select a server and enter user ID", "error");
            return;
        }
        if (!window.confirm("Clear all warnings for this user?")) {
            return;
        }
        setBusy(els.clearWarningsBtn, true, "Clearing...");
        try {
            await api(`/api/discord/moderation/warnings/${encodeURIComponent(gid)}/${encodeURIComponent(uid)}`, {
                method: "DELETE"
            });
            notify("Warnings cleared", "success");
            renderWarnings([]);
        } catch (err) {
            notify(`Clear warnings failed: ${err.message}`, "error");
        } finally {
            setBusy(els.clearWarningsBtn, false);
        }
    }

    function applyPreset(mode) {
        if (mode === "relaxed") {
            els.antiSpamEnabled.checked = true;
            els.antiSpamLimit.value = 10;
            els.antiSpamWindow.value = 12;
            els.duplicateLimit.value = 5;
            els.mentionLimit.value = 8;
            els.antiLinkEnabled.checked = false;
            els.antiInviteEnabled.checked = true;
            els.antiEmojiEnabled.checked = false;
            els.antiLineEnabled.checked = false;
            els.antiLongEnabled.checked = false;
            notify("Relaxed preset applied", "success");
            return;
        }

        if (mode === "strict") {
            els.antiSpamEnabled.checked = true;
            els.antiSpamLimit.value = 5;
            els.antiSpamWindow.value = 8;
            els.duplicateLimit.value = 3;
            els.mentionLimit.value = 3;
            els.antiLinkEnabled.checked = true;
            els.antiInviteEnabled.checked = true;
            els.antiEmojiEnabled.checked = true;
            els.emojiLimit.value = 10;
            els.antiLineEnabled.checked = true;
            els.lineLimit.value = 10;
            els.antiLongEnabled.checked = true;
            els.charLimit.value = 1200;
            els.newAccountGuardEnabled.checked = true;
            els.newAccountAgeMinutes.value = 120;
            els.warnEscalationEnabled.checked = true;
            notify("Strict preset applied", "success");
            return;
        }

        els.antiSpamEnabled.checked = true;
        els.antiSpamLimit.value = 6;
        els.antiSpamWindow.value = 10;
        els.duplicateLimit.value = 4;
        els.mentionLimit.value = 5;
        els.antiLinkEnabled.checked = true;
        els.antiInviteEnabled.checked = true;
        els.antiEmojiEnabled.checked = true;
        els.emojiLimit.value = 14;
        els.antiLineEnabled.checked = false;
        els.antiLongEnabled.checked = false;
        notify("Balanced preset applied", "success");
    }

    function setAdvancedVisibility(visible) {
        advancedVisible = !!visible;
        if (els.moderationSettingsBlock) {
            if (advancedVisible) {
                els.moderationSettingsBlock.classList.remove("collapsed-advanced");
            } else {
                els.moderationSettingsBlock.classList.add("collapsed-advanced");
            }
        }
        if (els.toggleAdvancedBtn) {
            els.toggleAdvancedBtn.textContent = advancedVisible ? "Hide Advanced Settings" : "Show Advanced Settings";
        }
        if (els.advancedStateLabel) {
            els.advancedStateLabel.textContent = advancedVisible
                ? "Advanced settings are visible"
                : "Advanced settings are hidden";
        }
    }

    function applyGuidedProfile(profile) {
        if (profile === "starter") {
            applyPreset("relaxed");
            els.enabled.checked = true;
            els.exemptAdmins.checked = true;
            els.warnEscalationEnabled.checked = false;
            els.raidModeEnabled.checked = false;
            enforceMode("learning");
            setAdvancedVisibility(false);
            notify("Starter profile applied: safe defaults with low false positives", "success");
            updateChecklist();
            return;
        }

        if (profile === "high_security") {
            applyPreset("strict");
            els.enabled.checked = true;
            els.exemptAdmins.checked = true;
            els.newAccountGuardEnabled.checked = true;
            els.newAccountAgeMinutes.value = 180;
            els.warnEscalationEnabled.checked = true;
            els.warnMax.value = 3;
            enforceMode("aggressive");
            setAdvancedVisibility(true);
            notify("High Security profile applied: stricter anti-raid protection", "success");
            updateChecklist();
            return;
        }

        applyPreset("balanced");
        els.enabled.checked = true;
        els.exemptAdmins.checked = true;
        els.warnEscalationEnabled.checked = true;
        els.warnMax.value = 4;
        enforceMode("standard");
        setAdvancedVisibility(false);
        notify("Balanced profile applied: recommended for most communities", "success");
        updateChecklist();
    }

    async function testConnection() {
        if (!API_BASE) {
            notify("API URL missing in config", "error");
            setConnectionStatus("Missing API URL", false);
            return;
        }

        setBusy(els.testConnectionBtn, true, "Testing...");
        try {
            const response = await fetch(`${API_BASE}/health`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            setConnectionStatus("Healthy", true);
            notify("Connection healthy", "success");
        } catch (err) {
            setConnectionStatus("Health check failed", false);
            notify(`Connection failed: ${err.message}`, "error");
        } finally {
            setBusy(els.testConnectionBtn, false);
        }
    }

    async function fetchServersFromApi() {
        const token = getToken();
        if (!token) {
            return;
        }
        try {
            const response = await api("/api/discord/servers");
            const remoteServers = (response && response.data && response.data.servers) || [];
            if (!Array.isArray(remoteServers) || !remoteServers.length) {
                return;
            }
            const localServers = loadServers();
            const merged = mergeServers(localServers, remoteServers);
            saveServers(merged);
            renderServers();
            notify(`Loaded ${remoteServers.length} server(s) from Discord`, "success");
            setLastAction("Synced Discord servers list");
        } catch (err) {
            notify(`Could not load Discord servers: ${err.message}`, "error");
        }
    }

    function scheduleServerDiscovery() {
        if (serverDiscoveryAttempts >= 6) {
            return;
        }
        const local = loadServers();
        if (local.length > 0) {
            return;
        }
        serverDiscoveryAttempts += 1;
        fetchServersFromApi().finally(() => {
            if (loadServers().length === 0 && serverDiscoveryAttempts < 6) {
                setTimeout(scheduleServerDiscovery, 3000);
            }
        });
    }

    function escapeHtml(value) {
        return value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function addServer() {
        const guildId = String(els.newGuildId.value || "").trim();
        const label = String(els.newGuildName.value || "").trim();
        if (!/^\d{6,22}$/.test(guildId)) {
            notify("Enter a valid numeric guild ID", "error");
            return;
        }
        const list = loadServers();
        const exists = list.some((s) => String(s.guild_id) === guildId);
        if (exists) {
            notify("Server already exists", "error");
            return;
        }
        list.push({ guild_id: guildId, label: label || `Guild ${guildId}` });
        saveServers(list);
        renderServers();
        els.serverSelect.value = guildId;
        updateSelectedServerLabel();
        els.newGuildId.value = "";
        els.newGuildName.value = "";
        notify("Server added", "success");
    }

    function removeServer() {
        const gid = selectedGuildId();
        if (!gid) {
            notify("No server selected", "error");
            return;
        }
        const list = loadServers().filter((s) => String(s.guild_id) !== gid);
        saveServers(list);
        renderServers();
        notify("Server removed", "success");
    }

    function bindEvents() {
        els.saveTokenBtn.addEventListener("click", () => {
            const token = String(els.token.value || "").trim();
            if (!token) {
                notify("Token cannot be empty");
                return;
            }
            localStorage.setItem(TOKEN_KEY, token);
            setTokenStatus();
            notify("Token saved");
        });

        els.clearTokenBtn.addEventListener("click", () => {
            localStorage.removeItem(TOKEN_KEY);
            els.token.value = "";
            setTokenStatus();
        });

        els.addServerBtn.addEventListener("click", addServer);
        els.removeServerBtn.addEventListener("click", removeServer);
        els.loadConfigBtn.addEventListener("click", loadConfig);
        els.refreshConfigBtn.addEventListener("click", loadConfig);
        els.saveConfigBtn.addEventListener("click", saveConfig);
        els.loadCasesBtn.addEventListener("click", loadCases);
        els.loadWarningsBtn.addEventListener("click", loadWarnings);
        els.clearWarningsBtn.addEventListener("click", clearWarnings);
        els.testConnectionBtn.addEventListener("click", testConnection);
        els.testConnectionBtn.addEventListener("click", fetchServersFromApi);
        if (els.syncServersBtn) {
            els.syncServersBtn.addEventListener("click", fetchServersFromApi);
        }
        els.presetRelaxedBtn.addEventListener("click", function () { applyPreset("relaxed"); });
        els.presetBalancedBtn.addEventListener("click", function () { applyPreset("balanced"); });
        els.presetStrictBtn.addEventListener("click", function () { applyPreset("strict"); });
        if (els.applyGuidedBtn) {
            els.applyGuidedBtn.addEventListener("click", function () {
                const selected = (els.guidedMode && els.guidedMode.value) || "balanced";
                const enforcement = (els.enforcementMode && els.enforcementMode.value) || "standard";
                applyGuidedProfile(selected);
                enforceMode(enforcement);
                updateChecklist();
            });
        }
        if (els.toggleAdvancedBtn) {
            els.toggleAdvancedBtn.addEventListener("click", function () {
                setAdvancedVisibility(!advancedVisible);
            });
        }
        els.serverSelect.addEventListener("change", updateSelectedServerLabel);
        [
            els.enabled,
            els.exemptAdmins,
            els.logChannelId,
            els.exemptRoleIds,
            els.exemptChannelIds,
            els.enforcementMode
        ].forEach((node) => {
            if (!node) {
                return;
            }
            const evt = node.tagName === "SELECT" || (node.tagName === "INPUT" && node.type === "checkbox") ? "change" : "input";
            node.addEventListener(evt, updateChecklist);
        });
        els.newGuildId.addEventListener("keydown", function (evt) {
            if (evt.key === "Enter") {
                addServer();
            }
        });
        els.newGuildName.addEventListener("keydown", function (evt) {
            if (evt.key === "Enter") {
                addServer();
            }
        });
    }

    function init() {
        if (!API_BASE) {
            notify("API base URL is missing in config.js", "error");
            setConnectionStatus("Missing API URL", false);
        } else {
            setConnectionStatus("Not tested", false);
        }
        els.token.value = getToken();
        setTokenStatus();
        renderServers();
        updateSelectedServerLabel();
        bindEvents();
        setAdvancedVisibility(false);
        updateChecklist();
        fetchServersFromApi();
        scheduleServerDiscovery();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
