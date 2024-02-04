'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserValidation } from '@/lib/validations/user';
import { z } from 'zod';
import Image from 'next/image';
import { ChangeEvent, useState } from 'react';

interface Props {
  user: {
    id: string;
    objectId: string;
    username: string;
    name: string;
    bio: string;
    image: string;
  };
  btnTitle: string;
}

const AccountProfile = ({ user, btnTitle }: Props) => {
  const [files, setFiles] = useState<File[]>([]);
  const form = useForm({
    resolver: zodResolver(UserValidation),
    defaultValues: {
      profile_photo: user?.image || '',
      name: user?.name || '',
      username: user?.username || '',
      bio: user?.bio || '',
    },
  });

  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void,
  ) => {
      e.preventDefault;

      const fileReader = new FileReader();

      if (e.target.files && e.target.files.length > 1) {
          const file = e.target.files[0];

          setFiles(Array.from(e.target.files));

          if (!file.type.includes('image')) return;

          fileReader.onload = async (event) => {
              const imageDataUrl = event.target?.result?.toString() || '';

              fieldChange(imageDataUrl);
          }

          fileReader.readAsDataURL(file);
      }
  };

  function onSubmit(values: z.infer<typeof UserValidation>) {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  }
};

export default AccountProfile;
