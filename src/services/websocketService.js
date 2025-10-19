import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// stompClient 인스턴스를 모듈 스코프에서 관리하여 애플리케이션 전체에서 공유.
let stompClient = null;

//연결 상태를 관리할 Promise
let connectionPromise = null;

// 구독 정보를 중앙에서 관리하기 위한 Map 객체
const subscriptions = new Map();

/**
 * WebSocket에 연결하는 함수.
 * @param {string | null} token - 인증 토큰 (로그인 시) 또는 null (익명)
 */
const connect = (token) => {
    // 웹 소켓이 이미 연결되어 있다면 중복 실행을 방지.
    if (connectionPromise) {
        console.log('WebSocket is already connected.');
        return connectionPromise;
    }

    const connectHeaders = {};
    if (token) {
        // 토큰이 있을 경우에만 Authorization 헤더를 추가하여 인증된 연결을 시도.
        connectHeaders['Authorization'] = `Bearer ${token}`;
    }

    connectionPromise = new Promise((resolve, reject) => {
        try{
            stompClient = new Client({
        webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_SERVER_URL}/api/ws-auction`), 
        connectHeaders: connectHeaders,
        onConnect: () => {
            console.log(`WebSocket Connected as ${token ? 'Authenticated User' : 'Anonymous User'}`);
            resolve(); // 연결이 성공했음을 알림
        },
        onStompError: (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
            reject(new Error('STOMP connection error'));
        },
        reconnectDelay: 5000, // 5초마다 자동 재연결을 시도합니다.
    });

    stompClient.activate();

        }catch(error){
            console.error("SockJS or STOMP client creation failed", error);
            reject(error);
        }
    });

    return connectionPromise;
};

/**
 * WebSocket 연결을 끊는 함수.
 */
const disconnect = () => {
    if (stompClient && stompClient.active) {
        stompClient.deactivate();
    }
    stompClient = null;
    connectionPromise = null; 
    // 연결 해제 시 모든 구독 정보도 초기화
    subscriptions.clear(); 
    console.log('WebSocket Disconnected.');
};

/**
 * 특정 토픽을 구독하는 서비스 함수.
 * 컴포넌트는 이 함수만 알면 됩니다.
 * @param {string} topic - 구독할 토픽 경로 (e.g., '/topic/auctions/1')
 * @param {function} callback - 메시지 수신 시 실행될 콜백 함수
 */
const subscribe = async (topic, callback) => {
    try{
        await connectionPromise;

        if (!stompClient || !stompClient.active) {
            console.warn('WebSocket is not connected. Cannot subscribe.');
            return;
        }

        // 이미 해당 토픽에 대한 Stomp 구독이 있다면 콜백만 추가하고, 없다면 새로 구독
        if (!subscriptions.has(topic)) {
            const subscription = stompClient.subscribe(topic, (message) => {
                // 이 토픽을 구독하는 모든 콜백들에게 메시지를 전달
                subscriptions.get(topic)?.callbacks.forEach(cb => cb(message));
            });
            subscriptions.set(topic, { stompSub: subscription, callbacks: [callback] });
        } else {
            subscriptions.get(topic).callbacks.push(callback);
    }
    }catch(error){
        console.error('Failed to subscribe due to connection issue:', error);
    }
    
};

/**
 * 특정 토픽의 구독을 취소하는 서비스 함수.
 * @param {string} topic - 구독 취소할 토픽 경로
 */
const unsubscribe = (topic) => {
    const sub = subscriptions.get(topic);
    if (sub) {
        sub.stompSub.unsubscribe(); // 실제 Stomp 구독 취소
        subscriptions.delete(topic); // 관리 목록에서 제거
        console.log(`Unsubscribed from ${topic}`);
    }
};

/**
 * 서버에 메시지를 발행(전송)하는 서비스 함수.
 * @param {object} params - { destination, body }
 */
const publish = async (params) => {
    try{
        await connectionPromise;

        if (!stompClient || !stompClient.active) {
            console.error('WebSocket is not connected. Cannot publish message.');
            return;
        }
        stompClient.publish(params);
    }catch(error){
        console.error('Failed to publish message due to connection issue:', error);
    }

};

export { connect, disconnect, subscribe, unsubscribe, publish };

