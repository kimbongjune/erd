import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function PUT(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    // 요청 본문 파싱
    const { name, image } = await request.json();

    if (!name && !image) {
      return NextResponse.json({ error: '변경할 정보를 입력해주세요.' }, { status: 400 });
    }

    // MongoDB 연결
    await connectDB();

    // 사용자 정보 업데이트
    const updateData: any = {};
    if (name) updateData.name = name;
    if (image) updateData.image = image;

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        membershipType: updatedUser.membershipType
      },
      // 세션 업데이트를 위한 플래그
      shouldUpdateSession: true
    });

  } catch (error) {
    console.error('프로필 업데이트 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
