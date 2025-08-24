import { NextResponse } from 'next/server';
import { connectToDB } from '../../../../src/lib/mongodb';
import { getUserModel } from '../../../../src/models/User';
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

const createUserSchema = z.object({ name: z.string().min(1), email: z.string().email(), role: z.string().optional() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = createUserSchema.parse(body);
    await connectToDB();
    const User = getUserModel();
    const exists = await User.findOne({ email: data.email }).lean().exec();
    if (exists) return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    const created = await User.create({ name: data.name, email: data.email, role: data.role || 'user' });
    return NextResponse.json(created.toJSON(), { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 400 });
  }
}
