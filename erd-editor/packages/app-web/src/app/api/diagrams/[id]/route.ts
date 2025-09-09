import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import Diagram from '../../../../models/Diagram';
import { connectToDatabase } from '../../../../lib/mongodb';

// GET: 특정 다이어그램 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    await connectToDatabase();
    const { id } = await params;

    // 먼저 다이어그램이 존재하는지 확인
    const diagram = await Diagram.findById(id);

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    // 소유자인지 확인
    const isOwner = session?.user?.email === diagram.userEmail;
    
    // 로그인하지 않았고 비공개 다이어그램인 경우
    if (!session?.user?.email && !diagram.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 로그인했지만 소유자가 아니고 비공개 다이어그램인 경우
    if (session?.user?.email && !isOwner && !diagram.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 응답에 소유자 정보 포함
    return NextResponse.json({ 
      diagram,
      isOwner,
      userEmail: diagram.userEmail
    });

  } catch (error) {
    const { id } = await params;
    console.error(`GET /api/diagrams/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: 다이어그램 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const body = await request.json();
    const { title, description, isPublic, tags, erdData } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (tags !== undefined) updateData.tags = tags;
    if (erdData !== undefined) updateData.erdData = erdData;

    const diagram = await Diagram.findOneAndUpdate(
      {
        _id: id,
        userEmail: session.user.email
      },
      updateData,
      { new: true, runValidators: true }
    );

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Diagram updated successfully',
      diagram
    });

  } catch (error) {
    const { id } = await params;
    console.error(`PUT /api/diagrams/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: 다이어그램 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const diagram = await Diagram.findOneAndDelete({
      _id: id,
      userEmail: session.user.email
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Diagram deleted successfully'
    });

  } catch (error) {
    const { id } = await params;
    console.error(`DELETE /api/diagrams/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
