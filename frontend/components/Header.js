'use client'; 
import { useEffect, useState } from 'react';
import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/constants";
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {

    const { address, isConnected } = useAccount();

    const [balance, setBalance] = useState("0");

    const { data, isLoading, refetch } = useReadContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'getUserBalance',
    })

    // Met à jour la balance lorsque l'utilisateur se connecte ou se déconnecte
    useEffect(() => {
        if (isConnected) {
            refetch(); // Récupère la balance dès que connecté
        } else {
            setBalance("0"); // Réinitialise la balance si déconnecté
        }
    }, [isConnected, refetch]);

    // Met à jour la balance chaque fois que data change
    useEffect(() => {
        if (data) {
            setBalance(data.toString());
        }
    }, [data]);


    return (
        <div className="flex justify-between items-center p-5">
            {isConnected ? (
                <div>
                    <span>D4A Balance: </span>
                    {isLoading ? "Loading..." : `${balance} D4A`}
                </div>
            ) : (
                "D4A DApp"
            )}
            <div>
                <ConnectButton showBalance={false} />
            </div>
        </div>
    );
}

export default Header