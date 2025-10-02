// Create this as /lib/hooks/useUnreadMessages.js
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export function useUnreadMessages(user) {
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }
    
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_email', user.email)
        .eq('is_read', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    fetchUnreadCount()

    if (user) {
      // Set up real-time listener for new messages
      const messagesSubscription = supabase
        .channel('messages')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'messages',
            filter: `recipient_email=eq.${user.email}`
          }, 
          () => {
            fetchUnreadCount()
          }
        )
        .subscribe()

      return () => {
        messagesSubscription.unsubscribe()
      }
    }
  }, [user])

  return { unreadCount, refetchUnreadCount: fetchUnreadCount }
}