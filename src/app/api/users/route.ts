import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import { getUserModel } from '@/models/User';
import { z } from 'zod';

export async function GET() {
  try {
    await connectToDB();
    const User = getUserModel();
    const users = await User.find().lean().exec();
    return NextResponse.json(users.map(u => ({ ...u })));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

const createUserSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6), role: z.enum(['user','admin']).optional() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);
    await connectToDB();
    const User = getUserModel();
    const exists = await User.findOne({ email: data.email }).lean().exec();
    if (exists) return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    // hash password
    // runtime require to avoid bundler issues
    // eslint-disable-next-line no-eval
    const reqfn: any = eval('require');
    const bcrypt = reqfn('bcryptjs');
    const hash = await bcrypt.hash(data.password, 10);
  // Public registration must always create standard users. Ignore any role supplied by client.
  const created = await User.create({ name: data.name, email: data.email, passwordHash: hash, role: 'user' });
  return NextResponse.json({ id: created._id, email: created.email, name: created.name, role: created.role }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 400 });
  }
}
