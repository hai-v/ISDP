USE bullseye;

DELIMITER $$
--
-- Procedures
--
CREATE PROCEDURE IF NOT EXISTS `createCourier` (IN `inCourierName` VARCHAR(50), IN `inAddress` VARCHAR(50), IN `inCity` VARCHAR(50), IN `inProvinceID` VARCHAR(2), IN `inPostalCode` VARCHAR(10), IN `inCountry` VARCHAR(50), IN `inCourierEmail` VARCHAR(50), IN `inCourierPhone` VARCHAR(50), IN `inNotes` VARCHAR(2000))
BEGIN
    DECLARE nextCourierID INT(11);
    
    SET nextCourierID = (SELECT MAX(courierID) + 1 FROM courier);

    INSERT INTO courier (courierID, courierName, address, city, provinceID, postalCode, country, courierEmail, courierPhone, notes, active) VALUES (nextCourierID, inCourierName, inAddress, inCity, inProvinceID, inPostalCode, inCountry, inCourierEmail, inCourierPhone, inNotes, true);
END$$

CREATE PROCEDURE IF NOT EXISTS `createItem` (IN `inItemName` VARCHAR(100), IN `inSku` VARCHAR(50), IN `inDescription` VARCHAR(2000), IN `inCategoryName` VARCHAR(50), IN `inWeight` DOUBLE(9,2), IN `inCostPrice` DOUBLE(9,2), IN `inRetailPrice` DOUBLE(9,2), IN `inSupplierID` INT(11), IN `inCaseSize` INT(11), IN `inNotes` VARCHAR(2000))
BEGIN
    DECLARE nextItemID int(11);
    
    SET nextItemID = (SELECT MAX(itemID) + 1 FROM item);

    INSERT INTO item (itemID, itemName, sku, description, categoryName, weight, costPrice, retailPrice, supplierID, caseSize, notes, active) VALUES (nextItemID, inItemName, inSku, inDescription, inCategoryName, inWeight, inCostPrice, inRetailPrice, inSupplierID, inCaseSize, inNotes, true);
END$$

CREATE PROCEDURE IF NOT EXISTS `submitOrder` (IN `inTransactionID` INT(11))
BEGIN
    DECLARE curLocationID VARCHAR(4);
    DECLARE curEstimatedArrival DATE;

    SET curLocationID = (SELECT originalLocationID FROM transaction WHERE transactionID = inTransactionID);
    SET curEstimatedArrival = createEstimatedArrival(curLocationID);

    UPDATE transaction SET transactionStatus = "SUBMITTED" WHERE transactionID = inTransactionID;
    INSERT INTO transaction (transactionType, originalLocationID, creationDate, estimatedArrival, transactionStatus, sourceTransactionID, notes) VALUES ("ORDER", curLocationID, CURDATE(), curEstimatedArrival, "NEW", null, "");

    CALL populateOrder(curLocationID);
END$$

CREATE PROCEDURE IF NOT EXISTS `createMissingOrders` ()
BEGIN
    DECLARE tempLocationID VARCHAR(4);
    DECLARE curEstimatedArrival DATE;
    DECLARE finished INT DEFAULT 0;
    DECLARE curLocationID CURSOR FOR SELECT locationID FROM location WHERE locationID NOT IN (SELECT originalLocationID FROM transaction WHERE transactionStatus = "NEW" AND transactionType = "ORDER") AND locationTypeID = "STORE";
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN curLocationID;
        getLocationID: LOOP
            FETCH curLocationID INTO tempLocationID;
            IF finished = 1 THEN
                LEAVE getLocationID;
            END IF;
            SET curEstimatedArrival = createEstimatedArrival(tempLocationID);
            INSERT INTO transaction (transactionType, originalLocationID, creationDate, transactionStatus, sourceTransactionID, notes) VALUES ("ORDER", tempLocationID, CURDATE(), "NEW", null, "");
            CALL populateOrder(tempLocationID);
        END LOOP getLocationID;
    CLOSE curLocationID;

END$$

CREATE PROCEDURE IF NOT EXISTS `submitAllOrders` ()
BEGIN   
    DECLARE tempTransactionID INT(11);
    DECLARE submittedOrders INT(11);
    DECLARE newOrders INT(11);
    DECLARE countStores INT(11);
    DECLARE finished INT DEFAULT 0;
    -- select all orders that are NEW and not recently STATUS_OVERRIDE
    DECLARE curTransactionID CURSOR FOR SELECT transactionID FROM transaction WHERE transactiontype = "ORDER" AND transactionStatus = "NEW" AND originalLocationID IN (SELECT locationID FROM location WHERE locationtypeID = "STORE") AND notes NOT LIKE "%STATUS_OVERRIDE%";
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    SET submittedOrders = (SELECT COUNT(*) FROM transaction WHERE transactionType = "ORDER" AND transactionStatus = "SUBMITTED" AND originalLocationID IN (SELECT locationID FROM location WHERE locationTypeID ="STORE"));
    SET countStores = (SELECT COUNT(*) FROM location WHERE locationTypeID = "STORE");
    SET newOrders = (SELECT COUNT(*) FROM transaction WHERE transactionType = "ORDER" AND transactionStatus = "NEW" AND originalLocationID IN (SELECT locationID FROM location WHERE locationTypeID ="STORE"));

    IF newOrders != countStores THEN
        CALL createMissingOrders();
    END IF;        

    OPEN curTransactionID;
        getTransactionID: LOOP
            FETCH curTransactionID INTO tempTransactionID;
            -- only allow orders that are created in the same week to be submitted
            IF finished = 1 OR submittedOrders = countStores THEN
                LEAVE getTransactionID;
            END IF;
            CALL submitOrder(tempTransactionID);
        END LOOP getTransactionID;
    CLOSE curTransactionID;
END$$

CREATE PROCEDURE IF NOT EXISTS `changeOrderStatus` (IN `inTransactionID` INT(11))
BEGIN
    UPDATE transaction SET transactionStatus = "NEW" WHERE transactionID = inTransactionID;
    UPDATE transaction SET notes = CONCAT(IFNULL(notes, ""), "; STATUS_OVERRIDE: FROM SUBMITTED TO NEW") WHERE transactionID = inTransactionID;
END$$

CREATE PROCEDURE IF NOT EXISTS `removeItem` (IN `inTransactionID` INT(11), IN `inItemID` INT(11))
BEGIN
    DELETE FROM transactionline WHERE transactionID = inTransactionID AND itemID = inItemID;
    UPDATE transaction SET notes = CONCAT(IFNULL(notes, ""), "; REMOVE_ITEM: ", inItemID) WHERE transactionID = inTransactionID;
END$$

CREATE PROCEDURE IF NOT EXISTS `checkBackorder` ()
BEGIN
    DECLARE tempTlQuantity INT(11);
    DECLARE tempInvQuantity INT(11);
    DECLARE tempItemID INT(11);
    DECLARE finished INT DEFAULT 0;
    DECLARE curItemID CURSOR FOR SELECT DISTINCT itemID FROM transactionline WHERE transactionID IN (SELECT transactionID FROM transaction WHERE transactionStatus = "SUBMITTED" AND originalLocationID IN (SELECT locationID FROM location WHERE locationTypeID = "STORE") AND transactionType = "ORDER");
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN curItemID;
        getItemID: LOOP
            FETCH curItemID INTO tempItemID;
            IF finished = 1 THEN
                LEAVE getItemID;
            END IF;
            SET tempTlQuantity = (SELECT SUM(quantity) FROM transactionline WHERE itemID = tempItemID AND transactionID IN (SELECT transactionID FROM transaction WHERE transactionStatus = "SUBMITTED" AND originalLocationID IN (SELECT locationID FROM location WHERE locationTypeID = "STORE") AND transactionType = "ORDER"));
            SET tempInvQuantity = (SELECT quantity FROM inventory WHERE locationID = "WARE" AND itemID = tempItemID);
        END LOOP getItemID;
    CLOSE curItemID;
END$$

CREATE FUNCTION IF NOT EXISTS `createEstimatedArrival` (inLocationID VARCHAR(4)) RETURNS DATE DETERMINISTIC
BEGIN
    DECLARE curEstimatedArrival DATE;
    DECLARE newYearsDay, familyDay, goodFriday, victoriaDay, canadaDay, newBrunswickDay, labourDay, thanksgivingDay, remembranceDay, christmasDay, boxingDay DATE;

    SET curEstimatedArrival = (SELECT DATE_ADD(CURDATE(), INTERVAL - WEEKDAY(CURDATE()) + 7 + (SELECT FIELD ((SELECT deliveryDay FROM location WHERE locationID = inLocationID), "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY")) DAY));
    SET curEstimatedArrival = DATE_ADD(curEstimatedArrival, INTERVAL - 4 HOUR);

    SET newYearsDay = (SELECT DATE(CONCAT_WS("-", YEAR(CURDATE()), "01", "01")));
    SET familyDay = DATE("2020-02-17");
    SET goodFriday = DATE("2020-04-10");
    SET victoriaDay = DATE("2020-05-18");
    SET canadaDay = DATE("2020-07-01");
    SET newBrunswickDay = DATE("2020-08-03");
    SET labourDay = DATE("2020-09-07");
    SET thanksgivingDay = DATE("2020-10-12");
    SET remembranceDay =(SELECT DATE(CONCAT_WS("-", YEAR(CURDATE()), "11", "11")));
    SET christmasDay = (SELECT DATE(CONCAT_WS("-", YEAR(CURDATE()), "12", "25")));
    SET boxingDay = (SELECT DATE(CONCAT_WS("-", YEAR(CURDATE()), "12", "26")));

    IF (SELECT FIELD(curEstimatedArrival, newYearsDay, familyDay, goodFriday, victoriaDay, canadaDay, newBrunswickDay, labourDay, thanksgivingDay, remembranceDay, christmasDay, boxingDay)) > 0 THEN
        SET curEstimatedArrival = (SELECT DATE_ADD(curEstimatedArrival, INTERVAL 1 DAY));
        IF (DAYOFWEEK(curEstimatedArrival)) = 7 THEN
            SET curEstimatedArrival = (SELECT DATE_ADD(curEstimatedArrival, INTERVAL 2 DAY));
        END IF;
    END IF;

    RETURN (curEstimatedArrival);    
END$$

CREATE PROCEDURE IF NOT EXISTS `populateOrder` (IN `inOriginalLocationID` VARCHAR(4))
BEGIN
    DECLARE tempQuantity INT(11);
    DECLARE tempReorderThreshold INT(11);
    DECLARE tempReorderLevel INT(11);
    DECLARE tempCaseSize INT(11);
    DECLARE tempItemID INT(11);
    DECLARE expectedQuantity INT(11);
    DECLARE nextTransactionID INT(11);
    DECLARE finished INT DEFAULT 0;
    DECLARE curItemID CURSOR FOR SELECT itemID FROM inventory WHERE locationID = inOriginalLocationID;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    SET nextTransactionID = (SELECT MAX(transactionID) FROM transaction WHERE originalLocationID = inOriginalLocationID);

    OPEN curItemID;
        getItemID: LOOP
            FETCH curItemID INTO tempItemID;
            IF finished = 1 THEN
                LEAVE getItemID;
            END IF;
            -- calculate the expected quantity of an item coming FROM emergency, backorder and order that are not completed or newly created
            -- it is used to setup the order for next week, that is created on Saturday (after every weekly store order is expected to complete)
            -- Emergency, Backorder are by default set to SUBMITTED when fnished creating
            -- There is only one newly created order every week. It is not affected if the Warehouse Foreman reverts the status of one SUBMITTED order to NEW.
            -- If there is no expected quantity of the item, return a 0 instead of null
            SET expectedQuantity = (SELECT IFNULL(SUM(quantity), 0) FROM transactionline WHERE itemID = tempItemID AND transactionID IN (SELECT transactionID FROM transaction WHERE transactiontype IN ("EMERGENCY", "BACKORDER", "ORDER") AND transactionstatus != "COMPLETED" AND originalLocationID = inOriginalLocationID));
            SET tempQuantity = (SELECT quantity FROM inventory WHERE locationID = inOriginalLocationID AND itemID = tempItemID);
            SET tempReorderThreshold = (SELECT reorderThreshold FROM inventory WHERE locationID = inOriginalLocationID AND itemID = tempItemID);
            SET tempReorderLevel = (SELECT reorderLevel FROM inventory WHERE locationID = inOriginalLocationID AND itemID = tempItemID);
            IF tempQuantity + expectedQuantity < tempReorderThreshold THEN
                SET tempCaseSize = (SELECT caseSize FROM item WHERE itemID = tempItemID);                       
                INSERT INTO transactionline (transactionID, itemID, quantity) VALUES (nextTransactionID, tempItemID,  CEILING((tempReorderLevel - (tempQuantity + expectedQuantity)) / tempCaseSize) * tempCaseSize);
            END If;
        END LOOP getItemID;
    CLOSE curItemID;
END$$

CREATE PROCEDURE IF NOT EXISTS `modifyQuantity` (IN `oldQuantity` INT(11), IN `newQuantity` INT(11), IN `inTransactionID` INT(11), IN `inItemID` INT(11))
BEGIN
    DECLARE existBackorder INT(11);
    DECLARE locationID VARCHAR(11);
    DECLARE backorderID INT(11);

    SET existBackorder = (SELECT COUNT(*) FROM transaction WHERE transactionStatus = "SUBMITTED" AND sourceTransactionID = inTransactionID AND transactionType = "BACKORDER");
    SET locationID = (SELECT originalLocationID FROM transaction WHERE transactionID = inTransactionID);
    
    
    IF (existBackorder = 0) THEN
        INSERT INTO transaction (transactionType, originalLocationID, creationDate, transactionStatus, sourceTransactionID, notes) VALUES ("BACKORDER", locationID, NOW(), "SUBMITTED", inTransactionID, "");
    END IF;

    UPDATE transactionline SET quantity = newQuantity WHERE transactionID = inTransactionID AND itemID = inItemID;
    UPDATE transaction SET notes = CONCAT(IFNULL(notes, ""), "; MODIFIED_QUANTITY: ITEM ", inItemID, " FROM ", oldQuantity, " TO ", newQuantity) WHERE transactionID = inTransactionID;

    SET backorderID = (SELECT MAX(transactionID) FROM transaction WHERE originalLocationID = locationID);
    
    UPDATE transaction SET notes = CONCAT(IFNULL(notes, ""), "; BACKORDER: ", backorderID, ", itemID: ", inItemID, ", quantity: ", oldQuantity - newQuantity, ", ETA: N/A") WHERE transactionID = inTransactionID;

    INSERT INTO transactionline (transactionID, itemID, quantity) VALUES (backorderID, inItemID, oldQuantity - newQuantity);
END$$

CREATE PROCEDURE IF NOT EXISTS `processItem` (IN `inTransactionID` INT(11), IN `inItemID` INT(11), IN `inQuantity` INT(11))
BEGIN
    DECLARE processedItems INT(11);
    DECLARE items INT(11);

    INSERT INTO processingline (transactionID, itemID, quantity) VALUES (inTransactionID, inItemID, inQuantity);

    SET processedItems = (SELECT COUNT(*) FROM processingline WHERE transactionID = inTransactionID);
    SET items = (SELECT COUNT(*) FROM transactionline WHERE transactionID = inTransactionID);

    IF processedItems = items THEN
        UPDATE transaction SET transactionStatus = "READY" WHERE transactionID = inTransactionID;
        CALL createDelivery(inTransactionID);
        IF (SELECT transactionType FROM transaction WHERE transactionID = inTransactionID) = "BACKORDER" THEN
            UPDATE transaction SET estimatedArrival = createEstimatedArrival((SELECT locationID FROM transaction WHERE transactionID = inTransactionID)) WHERE transactionID = inTransactionID;
        END IF;
    END IF;
END$$

CREATE PROCEDURE IF NOT EXISTS `processAllItems` (IN `inTransactionID` INT(11))
BEGIN
    DECLARE tempItemID INT(11);
    DECLARE tempQuantity INT(11);
    DECLARE finished INT DEFAULT 0;
    DECLARE cur CURSOR FOR SELECT itemID, quantity FROM transactionline WHERE transactionID = inTransactionID AND itemID NOT IN (SELECT itemID FROM processingline WHERE transactionID = inTransactionID);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN cur;
        getCur: LOOP
            FETCH cur INTO tempItemID, tempQuantity;
            IF finished = 1 THEN
                LEAVE getCur;
            END IF;
            REPLACE INTO processingline (transactionID, itemID, quantity) VALUES (inTransactionID, tempItemID, tempQuantity);
        END LOOP getCur;
    CLOSE cur;

    UPDATE transaction SET transactionStatus = "READY" WHERE transactionID = inTransactionID;
    CALL createDelivery(inTransactionID);
    IF (SELECT transactionType FROM transaction WHERE transactionID = inTransactionID) = "BACKORDER" THEN
        UPDATE transaction SET estimatedArrival = createEstimatedArrival((SELECT locationID FROM transaction WHERE transactionID = inTransactionID)) WHERE transactionID = inTransactionID;
    END IF;
END$$

CREATE PROCEDURE IF NOT EXISTS `shipItem` (IN `inTransactionID` INT(11), IN `inItemID` INT(11), IN `inQuantity` INT(11))
BEGIN
    DECLARE shippedItems INT(11);
    DECLARE items INT(11);

    INSERT INTO shippingline (transactionID, itemID, quantity) VALUES (inTransactionID, inItemID, inQuantity);
    UPDATE inventory SET quantity = quantity - inQuantity WHERE itemID = tempItemID AND locationID = "WARE";

    SET shippedItems = (SELECT COUNT(*) FROM shippingline WHERE transactionID = inTransactionID);
    SET items = (SELECT COUNT(*) FROM transactionline WHERE transactionID = inTransactionID);

    IF shippedItems = items THEN
        UPDATE transaction SET transactionStatus = "IN TRANSIT" WHERE transactionID = inTransactionID;
        
    END IF;
END$$

CREATE PROCEDURE IF NOT EXISTS `shipAllItems` (IN `inTransactionID` INT(11))
BEGIN
    DECLARE tempItemID INT(11);
    DECLARE tempQuantity INT(11);
    DECLARE finished INT DEFAULT 0;
    DECLARE cur CURSOR FOR SELECT itemID, quantity FROM transactionline WHERE transactionID = inTransactionID AND itemID NOT IN (SELECT itemID FROM shippingline WHERE transactionID = inTransactionID);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN cur;
        getCur: LOOP
            FETCH cur INTO tempItemID, tempQuantity;
            IF finished = 1 THEN
                LEAVE getCur;
            END IF;
            REPLACE INTO processingline (transactionID, itemID, quantity) VALUES (inTransactionID, tempItemID, tempQuantity);
            UPDATE inventory SET quantity = quantity - tempQuantity WHERE itemID = tempItemID AND locationID = "WARE";
        END LOOP getCur;
    CLOSE cur;

    UPDATE transaction SET transactionStatus = "IN TRANSIT" WHERE transactionID = inTransactionID;
END$$

CREATE PROCEDURE IF NOT EXISTS `receiveItem` (IN `inTransactionID` INT(11), IN `inItemID` INT(11), IN `inQuantity` INT(11))
BEGIN
    DECLARE receivedItems INT(11);
    DECLARE items INT(11);

    INSERT INTO receivingline (transactionID, itemID, quantity) VALUES (inTransactionID, inItemID, inQuantity);
    UPDATE inventory SET quantity = quantity + inQuantity WHERE itemID = tempItemID AND locationID = (SELECT originalLocationID FROM transaction WHERE transactionID = inTransactionID);

    SET receivedItems = (SELECT COUNT(*) FROM receivingline WHERE transactionID = inTransactionID);
    SET items = (SELECT COUNT(*) FROM transactionline WHERE transactionID = inTransactionID);

    IF receivedItems = items THEN
        UPDATE transaction SET transactionStatus = "DELIVERED" WHERE transactionID = inTransactionID;
    END IF;
END$$

CREATE PROCEDURE IF NOT EXISTS `receiveAllItems` (IN `inTransactionID` INT(11))
BEGIN
    DECLARE tempItemID INT(11);
    DECLARE tempQuantity INT(11);
    DECLARE finished INT DEFAULT 0;
    DECLARE cur CURSOR FOR SELECT itemID, quantity FROM transactionline WHERE transactionID = inTransactionID AND itemID NOT IN (SELECT itemID FROM receivingline WHERE transactionID = inTransactionID);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN cur;
        getCur: LOOP
            FETCH cur INTO tempItemID, tempQuantity;
            IF finished = 1 THEN
                LEAVE getCur;
            END IF;
            REPLACE INTO receivingline (transactionID, itemID, quantity) VALUES (inTransactionID, tempItemID, tempQuantity);
            UPDATE inventory SET quantity = quantity + tempQuantity WHERE itemID = tempItemID AND locationID = (SELECT originalLocationID FROM transaction WHERE transactionID = inTransactionID);
        END LOOP getCur;
    CLOSE cur;

    UPDATE transaction SET transactionStatus = "DELIVERED" WHERE transactionID = inTransactionID;
END$$

CREATE PROCEDURE IF NOT EXISTS `createReturnOrder` (IN `inTransactionType` VARCHAR(50), IN `inOriginalLocationID` VARCHAR(4))
BEGIN
    DECLARE exist INT(11);
    
    SET exist = (SELECT COUNT(*) FROM transaction WHERE transactionType = inTransactionType AND originalLocationID = inOriginalLocationID AND transactionStatus = "NEW");

    IF exist < 1 THEN
        INSERT INTO transaction (transactionType, originalLocationID, creationDate, transactionStatus, notes) VALUES (inTransactionType, inOriginalLocationID, NOW(), "NEW", "");
    END IF;
END$$

CREATE PROCEDURE IF NOT EXISTS `submitLoss` (IN `inTransactionID` INT(11), IN `inNotes` VARCHAR(2000))
BEGIN
    DECLARE tempItemID INT(11);
    DECLARE tempQuantity INT(11);
    DECLARE curLocationID VARCHAR(11);
    DECLARE finished INT DEFAULT 0;
    DECLARE cur CURSOR FOR SELECT itemID, quantity FROM transactionline WHERE transactionID = inTransactionID;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;
    
    UPDATE transaction SET transactionStatus = 'COMPLETE', notes = inNotes WHERE transactionID = inTransactionID;
    SET curLocationID = (SELECT originalLocationID FROM transaction WHERE transactionID = inTransactionID);

    OPEN cur;
        getItemID: LOOP
            FETCH cur INTO tempItemID, tempQuantity;
            IF finished = 1 THEN
                LEAVE getItemID;
            END IF;
            UPDATE inventory SET quantity = (quantity - tempQuantity) WHERE locationID = curLocationID;
        END LOOP getItemID;
    CLOSE cur;
END$$

CREATE PROCEDURE IF NOT EXISTS `submitReturn` (IN `inTransactionID` INT(11))
BEGIN
    DECLARE tempItemID INT(11);
    DECLARE tempQuantity INT(11);
    DECLARE curLocationID VARCHAR(11);
    DECLARE finished INT DEFAULT 0;
    DECLARE cur CURSOR FOR SELECT itemID, quantity FROM transactionline WHERE transactionID = inTransactionID;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;
    
    UPDATE transaction SET transactionStatus = 'SUBMITTED' WHERE transactionID = inTransactionID;
    SET curLocationID = (SELECT originalLocationID FROM transaction WHERE transactionID = inTransactionID);

    OPEN cur;
        getItemID: LOOP
            FETCH cur INTO tempItemID, tempQuantity;
            IF finished = 1 THEN
                LEAVE getItemID;
            END IF;
            UPDATE inventory SET quantity = (quantity - tempQuantity) WHERE locationID = curLocationID;
        END LOOP getItemID;
    CLOSE cur;

    CALL createDelivery(inTransactionID);
END$$

CREATE PROCEDURE IF NOT EXISTS `createDelivery` (IN `inTransactionID` INT (11))
BEGIN
    DECLARE exist INT DEFAULT 0;
    DECLARE curLocationID VARCHAR(11);
    DECLARE curRouteID INT(11);
    DECLARE curDeliveryID INT(11);

    SET curLocationID = (SELECT originalLocationID FROM transaction WHERE transactionID = inTransactionID);
    SET exist = (SELECT COUNT(*) FROM DELIVERY WHERE YEARWEEK(dateTime) = YEARWEEK(CURDATE()) AND deliveryID IN (SELECT deliveryID FROM deliverytransaction WHERE routeID IN (SELECT routeID FROM route WHERE startLocationID = curLocationID OR destinationLocationID = curLocationID)));

    IF exist = 0 THEN
        INSERT INTO delivery (dateTime, courierID) VALUES (NOW(), 1);
    END IF;

    SET curRouteID = (SELECT routeID FROM route WHERE startLocationID = curLocationID);
    SET curDeliveryID = (SELECT MAX(deliveryID) FROM DELIVERY WHERE YEARWEEK(dateTime) = YEARWEEK(CURDATE()) AND deliveryID IN (SELECT deliveryID FROM deliverytransaction WHERE routeID IN (SELECT routeID FROM route WHERE startLocationID = curLocationID OR destinationLocationID = curLocationID)));
    REPLACE deliverytransaction (deliveryID, transactionID, routeID) VALUES (curDeliveryID, inTransactionID, curRouteID);

    CALL updateVehicle(curDeliveryID);
END$$

CREATE PROCEDURE IF NOT EXISTS `updateVehicle` (IN `inDeliveryID` INT(11))
BEGIN   
    DECLARE tempItemID INT(11);
    DECLARE tempQuantity INT(11);
    DECLARE curWeight INT DEFAULT 0;
    DECLARE finished INT DEFAULT 0;
    DECLARE cur CURSOR FOR SELECT itemID, quantity FROM transactionline WHERE transactionID IN (SELECT transactionID FROM deliverytransaction WHERE deliveryID = inDeliveryID);
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

    OPEN cur;
        getCur: LOOP
            FETCH cur INTO tempItemID, tempQuantity;
            IF finished = 1 THEN
                LEAVE getCur;
            END IF;
            SET curWeight = curWeight + tempQuantity * (SELECT weight FROM item WHERE itemID = tempItemID);
        END LOOP getCur;
    CLOSE cur;

    IF curWeight <= 852.75 THEN
        UPDATE delivery SET vehicleID = "VAN" WHERE deliveryID = inDeliveryID;
    ELSEIF curWeight <= 1292.74 THEN
        UPDATE delivery SET vehicleID = "LIGHT" WHERE deliveryID = inDeliveryID;
    ELSEIF curWeight <= 4086.87 THEN
        UPDATE delivery SET vehicleID = "MEDIUM" WHERE deliveryID = inDeliveryID;
    ELSE
        UPDATE delivery SET vehicleID = "HEAVY" WHERE deliveryID = inDeliveryID;
    END IF;
END$$

DELIMITER ;