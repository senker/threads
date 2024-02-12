"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

interface Params {
    userId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
    path: string;
}

/**
 * updateUser - Function to update user information.
 *
 * @param {string} userId - The ID of the user to be updated.
 * @param {string} username - The new username for the user.
 * @param {string} name - The new name for the user.
 * @param {string} bio - The new biography for the user.
 * @param {string} image - The new profile image URL for the user.
 * @param {string} path - The path of the page from which the update is requested.
 * @returns {Promise<void>} - Returns a promise indicating the completion of the update process.
 */
export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path
}: Params): Promise<void> {
    // Connect to the database
    connectToDB();

    try {
        // Find the user by their ID and update their information
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(), // Convert username to lowercase
                name,
                bio,
                image,
                onboarded: true,
            },
            { upsert: true } // Create a new document if not found
        );

        // If the update is requested from the profile edit page, revalidate the path
        if (path === '/profile/edit') {
            revalidatePath(path);
        }
    } catch (error: any) {
        // If an error occurs during the update process, throw an error with a descriptive message
        throw new Error(`Failed to create/update user: ${error.message}`)
    }
}

/**
 * fetchUser - Function to fetch user information by user ID.
 *
 * @param {string} userId - The ID of the user to be fetched.
 * @returns {Promise<User>} - Returns a promise containing the fetched user.
 */
export async function fetchUser(userId: string) {
    try {
        // Connect to the database
        connectToDB();
        return await User.findOne({ id: userId })/* .populate({ path: 'communities', model: Community }) */
        // Find and return the user with the specified user ID
    } catch (error: any) {
        // If an error occurs during fetching user, throw an error with a descriptive message
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

/**
 * fetchUserPosts - Function to fetch posts authored by a user.
 *
 * @param {string} userId - The ID of the user whose posts are to be fetched.
 * @returns {Promise<User>} - Returns a promise containing the user's posts.
 */
export async function fetchUserPosts(userId: string) {
    try {
        // Connect to the database
        connectToDB();
        // TODO: Populate community
        // Find all threads authored by the user with the specified user ID
        const threads = await User.findOne({ id: userId })
            .populate({
                path: 'threads',
                model: Thread,
                populate: {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: 'name image id' // Select specific fields of the author
                    }
                }
            })

        return threads;
    } catch (error: any) {
        // If an error occurs during fetching user posts, throw an error with a descriptive message
        throw new Error(`Failed to fetch user posts: ${error.message}`)
    }
}


/**
 * fetchUsers - Function to fetch users based on provided parameters.
 *
 * @param {string} userId - The ID of the user making the request.
 * @param {string} [searchString=""] - Optional parameter to filter users based on username or name.
 * @param {number} [pageNumber=1] - Optional parameter for pagination, indicating the page number.
 * @param {number} [pageSize=20] - Optional parameter for pagination, indicating the number of users per page.
 * @param {SortOrder} [sortBy="desc"] - Optional parameter to specify the sorting order.
 * @returns {Promise<{ users: User[], isNext: boolean }>} - Returns a promise containing the fetched users and a flag indicating if there are more users to fetch.
 */
export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc"
}: {
        userId: string;
        searchString?: string;
        pageNumber?: number;
        pageSize?: number;
        sortBy?: SortOrder;
 }) {
    try {
        // Establish connection to the database
        connectToDB();

        // Calculate the number of documents to skip based on pagination
        const skipAmount = (pageNumber - 1) * pageSize;

        // Create a regular expression for case-insensitive searching
        const regex = new RegExp(searchString, "i");

        // Define the initial query object with conditions
        const query: FilterQuery<typeof User> = {
            id: { $ne: userId }
        }

        // If a search string is provided, add search conditions to the query
        if (searchString.trim() !== '') {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } }
            ]
        }

        // Define the sorting options
        const sortOptions = { createdAt: sortBy };

        // Query the database to find users matching the conditions, sorted and paginated
        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        // Count the total number of users matching the query conditions
        const totalUsersCount = await User.countDocuments(query);

        // Execute the query to fetch users
        const users = await usersQuery.exec();

        // Determine if there are more users to fetch
        const isNext = totalUsersCount > skipAmount + users.length;

        // Return the fetched users and a flag indicating if there are more users to fetch
        return { users, isNext }
    } catch (error: any) {
        // If an error occurs during fetching users, throw an error with a descriptive message
        throw new Error(`Failed to fetch users: ${error.message}`)
    }
}