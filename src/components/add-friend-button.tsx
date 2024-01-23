"use client";

import React, { FC, useState } from 'react'
import Button from './ui/button';
import { addFriendValidator } from '@/lib/validations/add-friend';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface AddFriendButtonProps {

}

type FormData = z.infer<typeof addFriendValidator>;

export const AddFriendButton: FC<AddFriendButtonProps> = ({ }) => {

  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const { handleSubmit, setError, register, formState } = useForm<FormData>({
    resolver: zodResolver(addFriendValidator),
  });

  const addNewFriend = async (email: string) => {
    try {
      const validatedEmail = addFriendValidator.parse({ email });

      await axios.post("/api/friends/add", {
        email: validatedEmail,
      })

      setShowSuccess(true);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError("email", {
          message: error.message,
        });
        return;
      }

      if (error instanceof AxiosError) {
        setError("email", {
          message: error.response?.data,
        });
        return;
      }

      setError("email", {
        message: "Something went wrong!"
      });
    }
  }

  const onSubmit = (data: FormData) => {
    addNewFriend(data.email);
  }

  return (
    <form className="max-w-sm" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
        Add new friend by email
      </label>
      <div className="mt-2 flex gap-4">
        <input {...register("email")} type="email" className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6' placeholder='you@example.com' />
        <Button>
          Add
        </Button>
      </div>
      <p className="mt-3 text-sm text-red-500">{formState.errors.email?.message}</p>
      {showSuccess && <p className="mt-3 text-sm text-green-600">Friend request sent</p>}
    </form>
  )
}

