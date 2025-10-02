import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { 
      bikeId, 
      bikeTitle, 
      buyerName, 
      buyerEmail, 
      message, 
      sellerEmail 
    } = body

    // Validate required fields
    if (!bikeId || !bikeTitle || !buyerName || !buyerEmail || !message || !sellerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }

    // Create the message record
    const { data, error } = await supabase
      .from('messages')
      .insert({
        bike_id: bikeId,
        sender_email: buyerEmail,
        sender_name: buyerName,
        recipient_email: sellerEmail,
        subject: `Interest in: ${bikeTitle}`,
        message: message
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to send message' }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data.id 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}