import googleTTS from 'google-tts-api';

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';

import ffmpegPath from 'ffmpeg-static';

import {
    AudioPlayerStatus,
    NoSubscriberBehavior,
    StreamType,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel
} from '@discordjs/voice';

import { EmbedBuilder } from 'discord.js';

const LANGUAGE = 'es';
const LEAVE_DELAY = 30_000;
const VOICE_WARNING_COOLDOWN = 60_000;

const BACKUP_BOT_ID =
    '1537361613185613844';

const INFO_EMOJI =
    '<:info:1538323825542963270>';

export class TTSSystem {

    constructor(ttsChannelId) {
        this.ttsChannelId = ttsChannelId;

        this.queues = new Map();
        this.connections = new Map();
        this.players = new Map();
        this.activePlayback = new Map();
        this.leaveTimers = new Map();
        this.inactivityDisconnects = new Set();

        this.voiceWarningCooldowns = new Map();
    }

    async sendStatus(guild, text) {
        try {
            if (!this.ttsChannelId) {
                return;
            }

            const channel =
                guild.channels.cache.get(
                    this.ttsChannelId
                );

            if (
                !channel ||
                !channel.isTextBased() ||
                !channel.send
            ) {
                return;
            }

            const embed =
                new EmbedBuilder()
                    .setDescription(
                        `${INFO_EMOJI} ${text}`
                    );

            await channel.send({
                embeds: [embed]
            });

        } catch {}
    }

    getBotVoiceChannel(guild) {
        return (
            guild.members.me?.voice?.channel ||
            null
        );
    }

    getBackupBotVoiceChannel(guild) {
        const backupBot =
            guild.members.cache.get(
                BACKUP_BOT_ID
            );

        return (
            backupBot?.voice?.channel ||
            null
        );
    }

    async sendVoiceWarning(message) {
        if (
            !message ||
            !message.guild ||
            !message.author
        ) {
            return;
        }

        const key =
            `${message.guild.id}:${message.author.id}`;

        const now =
            Date.now();

        const lastWarning =
            this.voiceWarningCooldowns.get(
                key
            );

        if (
            lastWarning &&
            now - lastWarning <
                VOICE_WARNING_COOLDOWN
        ) {
            return;
        }

        this.voiceWarningCooldowns.set(
            key,
            now
        );

        await this.sendStatus(
            message.guild,
            'Debes estar en un canal de voz.'
        );
    }

    normalizeText(message) {
        if (!message) {
            return '';
        }

        let text =
            message.content || '';

        text =
            text.replace(
                /<@!?(\d+)>/g,
                (_, userId) => {
                    const member =
                        message.guild?.members.cache.get(
                            userId
                        );

                    if (member) {
                        return `@${member.displayName}`;
                    }

                    const user =
                        message.client?.users.cache.get(
                            userId
                        );

                    if (user) {
                        return `@${user.username}`;
                    }

                    return '@usuario';
                }
            );

        text =
            text.replace(
                /<@&\d+>/g,
                'archivo'
            );

        text =
            text.replace(
                /<#\d+>/g,
                'archivo'
            );

        text =
            text.replace(
                /<a?:\w+:\d+>/g,
                'archivo'
            );

        text =
            text.replace(
                /(?:[\u{1F1E6}-\u{1F1FF}]{2}|[\u{1F3FB}-\u{1F3FF}]|[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}])(?:[\u{FE0E}\u{FE0F}]|\u{200D}(?:[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]))*/gu,
                'archivo'
            );

        if (
            message.attachments?.size > 0
        ) {
            text =
                text
                    ? `${text} archivo`
                    : 'archivo';
        }

        if (
            message.stickers?.size > 0
        ) {
            text =
                text
                    ? `${text} archivo`
                    : 'archivo';
        }

        if (
            message.embeds?.some(
                embed =>
                    embed.image ||
                    embed.thumbnail ||
                    embed.video ||
                    embed.url
            )
        ) {
            text =
                text
                    ? `${text} archivo`
                    : 'archivo';
        }

        text =
            text
                .replace(
                    /\s+/g,
                    ' '
                )
                .trim();

        return text;
    }

    async handleMessage(message) {
        if (
            !message ||
            message.author.bot ||
            !message.guild
        ) {
            return;
        }

        const voiceChannel =
            message.member?.voice?.channel;

        if (!voiceChannel) {
            await this.sendVoiceWarning(
                message
            );

            return;
        }

        const guildId =
            message.guild.id;

        const currentBotChannel =
            this.getBotVoiceChannel(
                message.guild
            );

        if (
            currentBotChannel &&
            currentBotChannel.id !==
                voiceChannel.id
        ) {
            return;
        }

        const backupBotChannel =
            this.getBackupBotVoiceChannel(
                message.guild
            );

        if (
            !currentBotChannel &&
            backupBotChannel &&
            backupBotChannel.id ===
                voiceChannel.id
        ) {
            return;
        }

        const text =
            this.normalizeText(
                message
            );

        if (!text) {
            return;
        }

        let queue =
            this.queues.get(
                guildId
            );

        if (!queue) {
            queue = {
                items: [],
                processing: false
            };

            this.queues.set(
                guildId,
                queue
            );
        }

        queue.items.push({
            text,
            voiceChannel
        });

        if (!queue.processing) {
            await this.processQueue(
                guildId
            );
        }
    }

    async processQueue(guildId) {
        const queue =
            this.queues.get(
                guildId
            );

        if (
            !queue ||
            queue.processing
        ) {
            return;
        }

        queue.processing = true;

        try {

            while (
                queue.items.length > 0
            ) {
                const item =
                    queue.items.shift();

                if (!item) {
                    continue;
                }

                await this.processItem(
                    item
                );
            }

        } finally {

            queue.processing = false;

            if (
                queue.items.length === 0
            ) {
                this.queues.delete(
                    guildId
                );
            }
        }
    }

    async processItem(item) {
        let filePath = null;

        try {

            const guild =
                item.voiceChannel.guild;

            const currentBotChannel =
                this.getBotVoiceChannel(
                    guild
                );

            if (
                currentBotChannel &&
                currentBotChannel.id !==
                    item.voiceChannel.id
            ) {
                return;
            }

            const backupBotChannel =
                this.getBackupBotVoiceChannel(
                    guild
                );

            if (
                !currentBotChannel &&
                backupBotChannel &&
                backupBotChannel.id ===
                    item.voiceChannel.id
            ) {
                return;
            }

            filePath =
                await this.generateTTS(
                    item.text
                );

            const latestBotChannel =
                this.getBotVoiceChannel(
                    guild
                );

            if (
                latestBotChannel &&
                latestBotChannel.id !==
                    item.voiceChannel.id
            ) {
                await this.deleteTTSFile(
                    filePath
                );

                filePath = null;

                return;
            }

            await this.play(
                item.voiceChannel,
                filePath
            );

            filePath = null;

        } catch (error) {

            console.error(
                '[TTS] Error procesando TTS:',
                error
            );

            if (filePath) {
                await this.deleteTTSFile(
                    filePath
                );
            }
        }
    }

    async generateTTS(text) {
        const cleanText =
            text.trim();

        if (!cleanText) {
            throw new Error(
                'El texto está vacío.'
            );
        }

        const audioParts =
            await googleTTS.getAllAudioBase64(
                cleanText,
                {
                    lang: LANGUAGE,
                    slow: false,
                    host: 'https://translate.google.com',
                    timeout: 15_000
                }
            );

        if (!audioParts?.length) {
            throw new Error(
                'No se pudo generar el audio TTS.'
            );
        }

        const directory =
            await fs.mkdtemp(
                path.join(
                    os.tmpdir(),
                    'devgru-tts-'
                )
            );

        const filePath =
            path.join(
                directory,
                `${crypto.randomUUID()}.mp3`
            );

        const buffers =
            audioParts.map(
                part =>
                    Buffer.from(
                        part.base64,
                        'base64'
                    )
            );

        await fs.writeFile(
            filePath,
            Buffer.concat(
                buffers
            )
        );

        return filePath;
    }

    async deleteTTSFile(filePath) {
        if (!filePath) {
            return;
        }

        try {

            await fs.rm(
                filePath,
                {
                    force: true
                }
            );

            await fs.rm(
                path.dirname(filePath),
                {
                    recursive: true,
                    force: true
                }
            );

        } catch {}
    }

    async connect(voiceChannel) {
        const guildId =
            voiceChannel.guild.id;

        const existing =
            this.connections.get(
                guildId
            );

        if (existing) {

            const currentChannel =
                existing
                    .joinConfig
                    .channelId;

            if (
                currentChannel ===
                voiceChannel.id
            ) {
                return existing;
            }

            return existing;
        }

        const backupBotChannel =
            this.getBackupBotVoiceChannel(
                voiceChannel.guild
            );

        if (
            backupBotChannel &&
            backupBotChannel.id ===
                voiceChannel.id
        ) {
            return null;
        }

        const connection =
            joinVoiceChannel({
                channelId:
                    voiceChannel.id,

                guildId,

                adapterCreator:
                    voiceChannel.guild
                        .voiceAdapterCreator,

                selfDeaf: true,
                selfMute: false
            });

        try {

            await entersState(
                connection,
                VoiceConnectionStatus.Ready,
                15_000
            );

        } catch (error) {

            connection.destroy();

            throw error;
        }

        const player =
            createAudioPlayer({
                behaviors: {
                    noSubscriber:
                        NoSubscriberBehavior.Play
                }
            });

        connection.subscribe(
            player
        );

        this.connections.set(
            guildId,
            connection
        );

        this.players.set(
            guildId,
            player
        );

        return connection;
    }

    async play(
        voiceChannel,
        filePath
    ) {
        const guildId =
            voiceChannel.guild.id;

        const currentBotChannel =
            this.getBotVoiceChannel(
                voiceChannel.guild
            );

        if (
            currentBotChannel &&
            currentBotChannel.id !==
                voiceChannel.id
        ) {
            throw new Error(
                'El bot ya está en otro canal de voz.'
            );
        }

        const backupBotChannel =
            this.getBackupBotVoiceChannel(
                voiceChannel.guild
            );

        if (
            !currentBotChannel &&
            backupBotChannel &&
            backupBotChannel.id ===
                voiceChannel.id
        ) {
            await this.deleteTTSFile(
                filePath
            );

            return;
        }

        const connection =
            await this.connect(
                voiceChannel
            );

        if (!connection) {
            await this.deleteTTSFile(
                filePath
            );

            return;
        }

        const player =
            this.players.get(
                guildId
            );

        if (!player) {
            throw new Error(
                'No se pudo crear el reproductor de audio.'
            );
        }

        const latestBotChannel =
            this.getBotVoiceChannel(
                voiceChannel.guild
            );

        if (
            latestBotChannel &&
            latestBotChannel.id !==
                voiceChannel.id
        ) {
            await this.deleteTTSFile(
                filePath
            );

            return;
        }

        const ffmpeg =
            spawn(
                ffmpegPath,
                [
                    '-hide_banner',
                    '-loglevel',
                    'error',
                    '-i',
                    'pipe:0',
                    '-f',
                    's16le',
                    '-ar',
                    '48000',
                    '-ac',
                    '2',
                    'pipe:1'
                ],
                {
                    stdio: [
                        'pipe',
                        'pipe',
                        'pipe'
                    ]
                }
            );

        const input =
            createReadStream(
                filePath
            );

        input.pipe(
            ffmpeg.stdin
        );

        const resource =
            createAudioResource(
                ffmpeg.stdout,
                {
                    inputType:
                        StreamType.Raw
                }
            );

        return new Promise(
            (
                resolve,
                reject
            ) => {

                let started = false;
                let settled = false;

                const cleanup =
                    async () => {

                        try {
                            input.destroy();
                        } catch {}

                        try {
                            if (
                                ffmpeg.exitCode ===
                                    null &&
                                !ffmpeg.killed
                            ) {
                                ffmpeg.kill();
                            }
                        } catch {}

                        try {
                            ffmpeg.stdin.destroy();
                        } catch {}

                        try {
                            ffmpeg.stdout.destroy();
                        } catch {}

                        try {
                            ffmpeg.stderr.destroy();
                        } catch {}

                        await this.deleteTTSFile(
                            filePath
                        );
                    };

                const removeListeners =
                    () => {

                        player.off(
                            'stateChange',
                            onStateChange
                        );

                        player.off(
                            'error',
                            onPlayerError
                        );

                        input.off(
                            'error',
                            onInputError
                        );

                        ffmpeg.off(
                            'error',
                            onFFmpegError
                        );

                        ffmpeg.off(
                            'close',
                            onFFmpegClose
                        );
                    };

                const finish =
                    async () => {

                        if (settled) {
                            return;
                        }

                        settled = true;

                        removeListeners();

                        this.activePlayback.delete(
                            guildId
                        );

                        await cleanup();

                        resolve();
                    };

                const fail =
                    async error => {

                        if (settled) {
                            return;
                        }

                        settled = true;

                        removeListeners();

                        this.activePlayback.delete(
                            guildId
                        );

                        await cleanup();

                        reject(error);
                    };

                const cancel =
                    async () => {

                        if (settled) {
                            return;
                        }

                        settled = true;

                        removeListeners();

                        this.activePlayback.delete(
                            guildId
                        );

                        try {
                            player.stop();
                        } catch {}

                        await cleanup();

                        resolve();
                    };

                const onStateChange =
                    (
                        oldState,
                        newState
                    ) => {

                        if (
                            newState.status ===
                            AudioPlayerStatus.Playing
                        ) {
                            started = true;

                            return;
                        }

                        if (
                            started &&
                            newState.status ===
                            AudioPlayerStatus.Idle
                        ) {
                            finish();
                        }
                    };

                const onPlayerError =
                    error =>
                        fail(error);

                const onInputError =
                    error =>
                        fail(error);

                const onFFmpegError =
                    error =>
                        fail(error);

                const onFFmpegClose =
                    code => {

                        if (
                            code !== 0 &&
                            code !== null
                        ) {
                            fail(
                                new Error(
                                    `FFmpeg terminó con código ${code}.`
                                )
                            );
                        }
                    };

                this.activePlayback.set(
                    guildId,
                    {
                        cancel
                    }
                );

                input.once(
                    'error',
                    onInputError
                );

                ffmpeg.once(
                    'error',
                    onFFmpegError
                );

                ffmpeg.once(
                    'close',
                    onFFmpegClose
                );

                player.once(
                    'error',
                    onPlayerError
                );

                player.on(
                    'stateChange',
                    onStateChange
                );

                try {

                    player.play(
                        resource
                    );

                } catch (error) {

                    fail(error);
                }
            }
        );
    }

    stop(guildId) {
        const playback =
            this.activePlayback.get(
                guildId
            );

        if (playback) {
            playback.cancel();

            return true;
        }

        const player =
            this.players.get(
                guildId
            );

        if (!player) {
            return false;
        }

        return player.stop();
    }

    disconnect(guildId) {
        const queue =
            this.queues.get(
                guildId
            );

        if (queue) {
            queue.items.length = 0;

            this.queues.delete(
                guildId
            );
        }

        this.stop(
            guildId
        );

        const connection =
            this.connections.get(
                guildId
            );

        if (connection) {
            connection.destroy();
        }

        this.players.delete(
            guildId
        );

        this.connections.delete(
            guildId
        );

        return true;
    }

    isConnected(guildId) {
        return this.connections.has(
            guildId
        );
    }

    handleVoiceStateUpdate(
        oldState,
        newState,
        client
    ) {
        const guild =
            newState.guild ||
            oldState.guild;

        if (!guild) {
            return;
        }

        if (
            oldState.id ===
            client.user.id
        ) {
            const oldChannelId =
                oldState.channelId;

            const newChannelId =
                newState.channelId;

            if (
                oldState.serverMute !==
                    newState.serverMute ||
                oldState.selfMute !==
                    newState.selfMute
            ) {
                if (
                    newState.serverMute ||
                    newState.selfMute
                ) {
                    this.sendStatus(
                        guild,
                        'Fui silenciado en el canal de voz.'
                    );
                }

                return;
            }

            if (
                oldChannelId ===
                newChannelId
            ) {
                return;
            }

            if (
                oldChannelId &&
                newChannelId
            ) {
                const timer =
                    this.leaveTimers.get(
                        oldChannelId
                    );

                if (timer) {
                    clearTimeout(
                        timer
                    );

                    this.leaveTimers.delete(
                        oldChannelId
                    );
                }

                this.sendStatus(
                    guild,
                    'Fui movido de canal de voz.'
                );

                return;
            }

            if (
                oldChannelId &&
                !newChannelId
            ) {
                const timer =
                    this.leaveTimers.get(
                        oldChannelId
                    );

                if (timer) {
                    clearTimeout(
                        timer
                    );

                    this.leaveTimers.delete(
                        oldChannelId
                    );
                }

                if (
                    this.inactivityDisconnects.has(
                        guild.id
                    )
                ) {
                    this.inactivityDisconnects.delete(
                        guild.id
                    );

                    this.disconnect(
                        guild.id
                    );

                    return;
                }

                this.disconnect(
                    guild.id
                );

                this.sendStatus(
                    guild,
                    'Fui desconectado del canal de voz.'
                );

                return;
            }

            return;
        }

        if (
            oldState.id ===
            BACKUP_BOT_ID
        ) {
            return;
        }

        const botMember =
            guild.members.me;

        if (!botMember) {
            return;
        }

        const botChannel =
            botMember.voice.channel;

        if (!botChannel) {
            return;
        }

        const botChannelId =
            botChannel.id;

        if (
            newState.channelId ===
            botChannelId
        ) {
            const timer =
                this.leaveTimers.get(
                    botChannelId
                );

            if (timer) {
                clearTimeout(
                    timer
                );

                this.leaveTimers.delete(
                    botChannelId
                );
            }

            return;
        }

        if (
            oldState.channelId !==
            botChannelId
        ) {
            return;
        }

        const member =
            newState.member ||
            oldState.member;

        if (
            !member ||
            member.user.bot
        ) {
            return;
        }

        const humans =
            botChannel.members.filter(
                voiceMember =>
                    !voiceMember.user.bot
            );

        if (
            humans.size > 0
        ) {
            return;
        }

        if (
            this.leaveTimers.has(
                botChannelId
            )
        ) {
            return;
        }

        const timer =
            setTimeout(
                async () => {

                    this.leaveTimers.delete(
                        botChannelId
                    );

                    const currentBotChannel =
                        guild.members.me
                            ?.voice.channel;

                    if (
                        !currentBotChannel ||
                        currentBotChannel.id !==
                            botChannelId
                    ) {
                        return;
                    }

                    const currentHumans =
                        currentBotChannel.members.filter(
                            voiceMember =>
                                !voiceMember.user.bot
                        );

                    if (
                        currentHumans.size > 0
                    ) {
                        return;
                    }

                    try {

                        this.inactivityDisconnects.add(
                            guild.id
                        );

                        await this.sendStatus(
                            guild,
                            'Abandoné el canal de voz por inactividad.'
                        );

                        this.disconnect(
                            guild.id
                        );

                        if (
                            guild.members.me
                                ?.voice.channel
                        ) {
                            await guild.members.me
                                .voice
                                .disconnect();
                        }

                    } catch (error) {

                        this.inactivityDisconnects.delete(
                            guild.id
                        );

                        console.error(
                            '[VOICE] Error al desconectar:',
                            error
                        );
                    }

                },
                LEAVE_DELAY
            );

        this.leaveTimers.set(
            botChannelId,
            timer
        );
    }
}
