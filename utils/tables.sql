CREATE TABLE `processingline` (
    `transactionID` INT(11) NOT NULL,
    `itemID` INT(11) NOT NULL,
    `quantity` INT(11) NOT NULL
);

ALTER TABLE `processingline`
    ADD PRIMARY KEY (`transactionID`,`itemID`),
    ADD KEY `transactionID` (`transactionID`),
    ADD KEY `itemID` (`itemID`),
    ADD CONSTRAINT `processingline_ibfk_1` FOREIGN KEY (`transactionID`) REFERENCES `transaction` (`transactionID`),
    ADD CONSTRAINT `processingline_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `item` (`itemID`);

CREATE TABLE `shippingline` (
    `transactionID` INT(11) NOT NULL,
    `itemID` INT(11) NOT NULL,
    `quantity` INT(11) NOT NULL
);

ALTER TABLE `shippingline`
    ADD PRIMARY KEY (`transactionID`,`itemID`),
    ADD KEY `transactionID` (`transactionID`),
    ADD KEY `itemID` (`itemID`),
    ADD CONSTRAINT `shippingline_ibfk_1` FOREIGN KEY (`transactionID`) REFERENCES `transaction` (`transactionID`),
    ADD CONSTRAINT `shippingline_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `item` (`itemID`);

CREATE TABLE `receivingline` (
    `transactionID` INT(11) NOT NULL,
    `itemID` INT(11) NOT NULL,
    `quantity` INT(11) NOT NULL
);

ALTER TABLE `receivingline`
    ADD PRIMARY KEY (`transactionID`,`itemID`),
    ADD KEY `transactionID` (`transactionID`),
    ADD KEY `itemID` (`itemID`),
    ADD CONSTRAINT `receivingline_ibfk_1` FOREIGN KEY (`transactionID`) REFERENCES `transaction` (`transactionID`),
    ADD CONSTRAINT `receivingline_ibfk_2` FOREIGN KEY (`itemID`) REFERENCES `item` (`itemID`);