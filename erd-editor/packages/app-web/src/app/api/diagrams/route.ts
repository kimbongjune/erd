import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import Diagram from '../../../models/Diagram';
import { connectToDatabase } from '../../../lib/mongodb';

// GET: 다이어그램 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // 검색 조건
    const query: any = { userEmail: session.user.email };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // 정렬 조건
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [diagramsRaw, total] = await Promise.all([
      Diagram.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('title description isPublic tags createdAt updatedAt erdData'),
      Diagram.countDocuments(query)
    ]);

    // 각 다이어그램의 통계 계산
    const diagrams = diagramsRaw.map(diagram => {
      const erdData = diagram.erdData;
      let entityCount = 0, relationCount = 0, commentCount = 0, imageCount = 0;
      
      if (erdData && erdData.nodes && erdData.edges) {
        entityCount = erdData.nodes.filter((node: any) => node.type === 'entity').length;
        relationCount = erdData.edges.length;
        commentCount = erdData.nodes.filter((node: any) => node.type === 'comment').length;
        imageCount = erdData.nodes.filter((node: any) => node.type === 'image').length;
      }
      
      return {
        id: diagram.id,
        title: diagram.title,
        description: diagram.description,
        isPublic: diagram.isPublic,
        tags: diagram.tags,
        createdAt: diagram.createdAt,
        updatedAt: diagram.updatedAt,
        entityCount,
        relationCount,
        commentCount,
        imageCount
      };
    });

    return NextResponse.json({
      diagrams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('GET /api/diagrams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: 새 다이어그램 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { title, description = '', isPublic = false, tags = [], erdData } = body;

    if (!title || !erdData) {
      return NextResponse.json(
        { error: 'Title and erdData are required' },
        { status: 400 }
      );
    }

    const diagram = new Diagram({
      title,
      description,
      userEmail: session.user.email,
      erdData,
      isPublic,
      tags
    });

    const savedDiagram = await diagram.save();

    return NextResponse.json({
      message: 'Diagram created successfully',
      diagram: savedDiagram
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/diagrams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
