import type { NextPage } from 'next';
import React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faUser, faGamepad, faHashtag } from '@fortawesome/free-solid-svg-icons';

type ApiResponse = {
    status: 'FOUND' | 'NOT_FOUND' | 'OFFLINE' | 'ONLINE_NOT_IN_GAME' | 'INVALID_USER' | 'INVALID_GAME' | 'ERROR';
    message: string;
    playerDetails?: {
        username: string;
        userId: number;
        avatarUrl: string;
    }
};

const Home: NextPage = () => {
    const [searchType, setSearchType] = useState<'username' | 'userId'>('username');
    const [searchValue, setSearchValue] = useState('');
    const [gameId, setGameId] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ApiResponse | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        const response = await fetch('/api/findPlayer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                gameId,
                searchType,
                searchValue,
            }),
        });

        const data: ApiResponse = await response.json();
        setResult(data);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <h1 className="text-4xl">😈rstalk</h1>
                <p className="text-zinc-500 text-sm">stalk your friends on roblox!</p>
                <p className="text-zinc-600 mb-4 text-xs">**you have to guess what game they might be in**</p>
                <form onSubmit={handleSearch}>
                <div className="my-2">
                    <label htmlFor="gameId" className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faHashtag} className="text-zinc-400" />
                        game id
                    </label>
                    <input
                        id="gameId"
                        type="number"
                        value={gameId}
                        onChange={(e) => setGameId(e.target.value)}
                        placeholder="enter game id..."
                        required
                        autoComplete="off"
                        className="w-full p-2 border-2 border-zinc-600 rounded-xl focus:ring-2 focus:ring-white outline-none text-sm"
                    />
                </div>

                <div className="">
                    <label htmlFor="searchValue" className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faUser} className="text-zinc-400" />
                        {searchType === 'username' ? (
                            <>
                                username <span className="text-xs text-zinc-500">(not display name)</span>
                            </>
                        ) : (
                            'user id'
                        )}
                    </label>
                    <input
                        id="searchValue"
                        type={searchType === 'userId' ? 'number' : 'text'}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder={searchType === 'username' ? 'enter username...' : 'enter user id...'}
                        required
                        autoComplete="off"
                        className="w-full p-2 border-2 border-zinc-600 rounded-xl focus:ring-2 focus:ring-white outline-none text-sm"
                    />
                </div>
                
                <div className="flex justify-between items-center w-full">
                    <div className="my-2 border-2 border-zinc-600 rounded-xl overflow-hidden text-sm bg-zinc-800 flex">
                        <button 
                            type="button" 
                            onClick={() => setSearchType('username')} 
                            className={`px-3 py-2 text-sm ${searchType === 'username' ? 'text-black bg-white' : 'hover:bg-zinc-700'} cursor-pointer transition-colors`}
                            >
                            username
                        </button>
                        <div className="w-px bg-zinc-600"></div>
                        <button 
                            type="button" 
                            onClick={() => setSearchType('userId')} 
                            className={`px-3 py-2 text-sm ${searchType === 'userId' ? 'text-black bg-white' : 'hover:bg-zinc-700'} cursor-pointer transition-colors`}
                        >
                            user id
                        </button>
                    </div>
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className={`border-2 border-zinc-600 rounded-xl p-2 text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                            isLoading 
                                ? 'bg-zinc-700 cursor-not-allowed opacity-50' 
                                : 'bg-zinc-800 hover:bg-zinc-700'
                        }`}
                    >
                        <FontAwesomeIcon icon={faSearch} />
                        {isLoading ? `Searching...` : 'Search'}
                    </button>
                </div>
            </form>

        {result && (
            <>
                <h2 className="mb-2 mt-4">result</h2>
                <div className="">
                    <p className="mb-2 text-sm">~ status: {result.status}</p>
                    <p className="mb-2 text-sm">~ result: {result.message}</p>
                    {result.playerDetails && (
                        <div className="flex items-center mt-4 pt-4 border-t border-zinc-500">
                            <img src={result.playerDetails.avatarUrl} alt={`${result.playerDetails.username}'s avatar`} className="w-24 h-24 rounded-full mr-5 border-2 border-zinc-300" />
                            <div>
                                <p className="mb-1">username: {result.playerDetails.username}</p>
                                <p>user id: {result.playerDetails.userId}</p>
                            </div>
                        </div>
                    )}
                </div>
            </>
        )}
            </div>
        </div>
    )
}
export default Home;