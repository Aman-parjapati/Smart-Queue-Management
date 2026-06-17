package com.smartqueue.server.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseService {

    // Map<businessId, Map<clientId, SseClient>>
    private final Map<UUID, Map<String, SseClient>> clients = new ConcurrentHashMap<>();

    public static class SseClient {
        private final SseEmitter emitter;
        private final UUID slotId;

        public SseClient(SseEmitter emitter, UUID slotId) {
            this.emitter = emitter;
            this.slotId = slotId;
        }

        public SseEmitter getEmitter() {
            return emitter;
        }

        public UUID getSlotId() {
            return slotId;
        }
    }

    public void addClient(UUID businessId, String clientId, SseEmitter emitter, UUID slotId) {
        clients.computeIfAbsent(businessId, k -> new ConcurrentHashMap<>())
               .put(clientId, new SseClient(emitter, slotId));

        log.info("SSE client {} connected to business {} for slot {}", clientId, businessId, slotId);

        emitter.onCompletion(() -> removeClient(businessId, clientId));
        emitter.onTimeout(() -> removeClient(businessId, clientId));
        emitter.onError((ex) -> removeClient(businessId, clientId));
    }

    public void removeClient(UUID businessId, String clientId) {
        Map<String, SseClient> bizClients = clients.get(businessId);
        if (bizClients != null) {
            bizClients.remove(clientId);
            if (bizClients.isEmpty()) {
                clients.remove(businessId);
            }
        }
        log.info("SSE client {} disconnected from business {}", clientId, businessId);
    }

    public void broadcastQueue(UUID businessId, UUID slotId, Object data) {
        Map<String, SseClient> bizClients = clients.get(businessId);
        if (bizClients == null) {
            return;
        }

        java.util.Iterator<Map.Entry<String, SseClient>> iterator = bizClients.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, SseClient> entry = iterator.next();
            String clientId = entry.getKey();
            SseClient client = entry.getValue();

            // Only send to clients who either haven't filtered by slotId,
            // or whose slotId matches the updated data's slotId.
            if (client.getSlotId() == null || client.getSlotId().equals(slotId)) {
                try {
                    SseEmitter.SseEventBuilder event = SseEmitter.event()
                            .data(data)
                            .name("message");
                    client.getEmitter().send(event);
                } catch (IOException e) {
                    // Client disconnected, cleanup using iterator to avoid ConcurrentModificationException
                    iterator.remove();
                    log.info("SSE client {} disconnected from business {} (cleanup during broadcast)", clientId, businessId);
                }
            }
        }

        if (bizClients.isEmpty()) {
            clients.remove(businessId);
        }
    }
}
