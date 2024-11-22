import {Loader} from "lucide-react";

export default function SecondaryLoadingSpinner() {
    return (
        <div className='w-full flex items-center justify-center'>
            <Loader className='mr-2 h-15 w-15 animate-spin' aria-hidden='true'/>
        </div>
    )
}