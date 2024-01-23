import { fetchRedis } from "@/helpers/redis";
import { authOptions } from "@/lib/authOptions";
import { db } from "@/lib/db";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { ZodError } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { email: emailToAdd } = addFriendValidator.parse(body.email);

    const idToAdd = await fetchRedis("get", `user:email:${emailToAdd}`) as string;

    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized.", { status: 401 });
    }

    if (!idToAdd) {
      return new Response("User doesn't exists.", { status: 422 });
    }

    if (emailToAdd === session.user.email) {
      return new Response("You can't add yourself as a friend.", { status: 400 });
    }

    const isAlreadyAdded = await fetchRedis("sismember", `user:${idToAdd}:incoming_friends_requests`, session.user.id) as 0 | 1;

    if (isAlreadyAdded) {
      return new Response("Already added this user.", { status: 400 });
    }

    const isAlreadyFriend = await fetchRedis("sismember", `user:${session.user.id}:friends`, idToAdd) as 0 | 1;

    if (isAlreadyFriend) {
      return new Response("Already friends with this user.", { status: 400 });
    }

    db.sadd(`user:${idToAdd}:incoming_friends_requests`, session.user.id);

    return new Response("Ok");
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response("Invalid request payload", { status: 422 });
    }

    console.log(error);
    return new Response("Invalid request", { status: 400 });
    
  }
}
