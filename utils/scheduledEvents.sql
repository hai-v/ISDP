USE bullseye;

SET GLOBAL event_scheduler="ON";

DROP EVENT IF EXISTS submitNewStoreOrder;

delimiter |

CREATE EVENT IF NOT EXISTS submitNewStoreOrder
    ON SCHEDULE EVERY 1 WEEK
        STARTS TIMESTAMP(CURRENT_DATE) + INTERVAL 5 - WEEKDAY(CURRENT_DATE) DAY
    DO
        BEGIN
            CALL submitAllOrders();
        END |

delimiter ;