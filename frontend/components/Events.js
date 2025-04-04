import React from 'react'
import { formatUnits } from 'ethers'
import { Badge } from './ui/badge'
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const Events = ({ events }) => {
  return (
    <div className='mt-20 px-5'>
      <h2 className='text-2xl font-bold mb-2'>Transaction history</h2>
      <ScrollArea className="h-80 w-full rounded-md border border-gray-300">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium leading-none">Events</h4>
          {events.map((event, index) => (
            <>
              <div key={index} className="p-4 mb-3 border-4 border-emerald-900 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={`px-2 py-1 ${
                    event.type === 'Deposited' || event.type === 'SuppliedToAave' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : event.type === 'Withdrawn' || event.type === 'WithdrawnFromAave' 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : ''
                  }`}>
                    {event.type}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(event.blockTimestamp * 1000).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 truncate">
                  <span className="font-medium">Adresse:</span> {event.address}
                </p>
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  {formatUnits(event.amount, 6)} USDC
                </p>
              </div>
              <Separator className="my-2" />
            </>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

export default Events