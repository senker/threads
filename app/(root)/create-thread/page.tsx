import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';

async function Page() {
    const user = await currentUser();

    return <h1 className="head-text">Create Thread</h1>
}

export default Page;