'use client'; 
import { useAccount } from "wagmi";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { User } from 'lucide-react';


const Header = () => {

    const { isConnected } = useAccount();

    return (
        <div className="flex justify-between items-center p-5">
            {isConnected ? (
                <div className='flex flex-row'>
                    <User />
                    <span className="pl-3">Your account</span>
                </div>
            ) : (
                "Not connected"
            )}
            <div>
                <ConnectButton showBalance={false} />
            </div>
        </div>
    );
}

export default Header