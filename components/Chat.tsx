
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { Send, User as UserIcon, MoreVertical } from 'lucide-react';

interface ChatProps {
  user: User;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load contacts
    if (user.role === 'ADMIN') {
      const members = JSON.parse(localStorage.getItem('invotrack_members') || '[]');
      const myMembers = members.filter((m: any) => m.adminId === user.id);
      setContacts(myMembers);
    } else {
      const admins = JSON.parse(localStorage.getItem('invotrack_admins') || '[]');
      const myAdmin = admins.find((a: any) => a.id === user.adminId);
      if (myAdmin) setContacts([myAdmin]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      const allMsgs = JSON.parse(localStorage.getItem('invotrack_messages') || '[]');
      setMessages(allMsgs.filter((m: Message) => 
        (m.senderId === user.id && m.receiverId === selectedContact.id) ||
        (m.senderId === selectedContact.id && m.receiverId === user.id)
      ));
    }
  }, [selectedContact, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedContact) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: selectedContact.id,
      text: inputText,
      timestamp: new Date().toISOString()
    };

    const all = JSON.parse(localStorage.getItem('invotrack_messages') || '[]');
    all.push(newMsg);
    localStorage.setItem('invotrack_messages', JSON.stringify(all));
    
    setMessages([...messages, newMsg]);
    setInputText('');

    // Simulate response for members
    if (user.role === 'MEMBER') {
       setTimeout(() => {
          const autoReply: Message = {
            id: (Date.now() + 1).toString(),
            senderId: selectedContact.id,
            receiverId: user.id,
            text: "Received your message! I'll review it shortly.",
            timestamp: new Date().toISOString()
          };
          const updatedAll = [...all, autoReply];
          localStorage.setItem('invotrack_messages', JSON.stringify(updatedAll));
          setMessages(prev => [...prev, autoReply]);
       }, 1500);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-[calc(100vh-12rem)] flex overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="w-1/3 border-r border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg font-heading">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedContact?.id === contact.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
              }`}
            >
              <img src={contact.avatar} className="w-10 h-10 rounded-full bg-slate-200" alt="" />
              <div className="text-left overflow-hidden">
                <p className="font-bold text-sm truncate">{contact.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{contact.role}</p>
              </div>
            </button>
          ))}
          {contacts.length === 0 && <p className="text-center text-sm text-slate-400 mt-10">No contacts available.</p>}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedContact.avatar} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <p className="font-bold text-slate-800">{selectedContact.name}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600"><MoreVertical size={20} /></button>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                    msg.senderId === user.id 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.text}
                    <p className={`text-[10px] mt-1 ${msg.senderId === user.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && <p className="text-center text-slate-400 text-sm py-20">Start a conversation with {selectedContact.name}</p>}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 flex gap-3">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <UserIcon size={48} className="mb-4 text-slate-200" />
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
