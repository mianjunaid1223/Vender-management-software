import { NextRequest, NextResponse } from 'next/server';
import { createContract, fetchContracts } from '@/lib/data';

export async function GET() {
  try {
    const contracts = await fetchContracts();
    // Ensure each contract has a unique 'id' from '_id'
    const serializedContracts = contracts.map(contract => ({
      ...contract,
      id: contract._id.toString(),
    }));
    return NextResponse.json(JSON.parse(JSON.stringify(serializedContracts)));
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contract = await createContract(body);
    const serializedContract = JSON.parse(JSON.stringify(contract));
    return NextResponse.json(serializedContract, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
