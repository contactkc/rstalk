import type { NextApiRequest, NextApiResponse } from 'next';

interface FindPlayerRequest {
    gameId: string;
    searchType: 'username' | 'userId';
    searchValue: string;
}

type FindPlayerResponse = {
    status: 'FOUND' | 'NOT_FOUND' | 'OFFLINE' | 'ONLINE_NOT_IN_GAME' | 'INVALID_USER' | 'INVALID_GAME' | 'ERROR';
    message: string;
    playerDetails?: {
        username: string;
        userId: number;
        avatarUrl: string;
    }
};

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse<FindPlayerResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            status: 'ERROR',
            message: 'method not allowed'
        });
    }

    const { gameId, searchType, searchValue } = req.body as FindPlayerRequest;

    if (!gameId || !searchType || !searchValue) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'missing required fields'
        });
    }

    let userId: number;
    let username: string;

    try {
        if (searchType === 'username') {
            const userRes = await fetch(`https://users.roblox.com/v1/usernames/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ usernames: [searchValue], excludeBannedUsers: true }),
            });
            const userData = await userRes.json();
            if (!userData.data || userData.data.length === 0) {
                return res.json({ 
                    status: 'INVALID_USER',
                    message: 'user not found'
                });
            }
            userId = userData.data[0].id;
            username = userData.data[0].name;
        } else {
            userId = parseInt(searchValue, 10);
            const userRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
            const userData = await userRes.json();
            if (userData.errors) {
                return res.json({
                    status: 'INVALID_USER',
                    message: 'user id is invalid'
                });
            }
            username = userData.name;
        }

        const presenceRes = await fetch(`https://presence.roblox.com/v1/presence/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [userId] }),
        });
        const presenceData = await presenceRes.json();
        const userPresence = presenceData.userPresences[0];

        if (userPresence.userPresenceType === 0) {
            return res.json({
                status: 'OFFLINE',
                message: `${username} is offline`
            });
        }

        if (userPresence.userPresenceType === 1) {
            return res.json({
                status: 'ONLINE_NOT_IN_GAME',
                message: `${username} is online but not in a game`
            });
        }

        let gameName: string;
        try {
            const universalIdRes = await fetch(`https://apis.roblox.com/universes/v1/places/${gameId}/universe`);
            const universalIdData = await universalIdRes.json();
            if  (!universalIdData.universeId) {
                return res.json({
                    status: 'INVALID_GAME',
                    message: 'game id is invalid'
                });
            }
            const universeId = universalIdData.universeId;

            const gameDetailsRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
            const gameDetailsData = await gameDetailsRes.json();
            if (!gameDetailsData.data || gameDetailsData.data.length === 0) {
                return res.json({
                    status: 'INVALID_GAME',
                    message: 'game id is invalid or details could not be fetched'
                });
            }
            gameName = gameDetailsData.data[0].name;
        } catch (error) {
            return res.json({
                status: 'INVALID_GAME',
                message: 'failed to fetch game details'
            });
        }

        const thumbRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
        const thumbData = await thumbRes.json();

        if (!thumbData.data || thumbData.data.length === 0 || !thumbData.data[0].imageUrl) {
            return res.status(500).json({
                status: 'INVALID_USER',
                message: 'failed to fetch user avatar'
            });
        }

        const targetAvatarUrl = thumbData.data[0].imageUrl;

        let allPlayerTokens: any[] = [];
        let cursor = '';
        let hasMorePages = true;

        while (hasMorePages) {
            const serverListRes = await fetch(`https://games.roblox.com/v1/games/${gameId}/servers/Public?sortOrder=Asc&limit=100&cursor=${cursor}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (serverListRes.status === 429) {
                setTimeout(() => {}, 1000);
                continue;
            }

            if (!serverListRes.ok) {
                return res.json({
                    status: 'INVALID_GAME',
                    message: `game id is invalid or has no active servers status: ${serverListRes.status}`
                });
            }
            const serverListData = await serverListRes.json();

            for (const server of serverListData.data) {
                for (const token of server.playerTokens) {
                    allPlayerTokens.push({
                        token: token,
                        type: 'AvatarHeadshot',
                        size: '150x150',
                        requestId: server.id,
                    });
                }
            }

            cursor = serverListData.nextPageCursor;
            hasMorePages = !!cursor;

            if (hasMorePages) {
                setTimeout(() => {}, 1000);
            }
        }

        const batchSize = 100;
        for (let i = 0; i < allPlayerTokens.length; i += batchSize) {
            const batch = allPlayerTokens.slice(i, i + batchSize);
            const batchThumbRes = await fetch(`https://thumbnails.roblox.com/v1/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batch),
            });
            const batchThumbData = await batchThumbRes.json();

            for (const avatar of batchThumbData.data) {
                if (avatar.imageUrl === targetAvatarUrl) {
                    return res.json({
                        status: 'FOUND',
                        message: `found ${username} in the game "${gameName}"`,
                        playerDetails: {
                            userId,
                            username,
                            avatarUrl: avatar.imageUrl
                        }
                    });
                }
            }
        }
        return res.json({
            status: 'NOT_FOUND',
            message: `${username} is in a private server or in a different game`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'ERROR',
            message: 'internal server error'
        });
    }
};