
class EliteEventData {
    constructor(date, operation, parameters) {
        this.date = new Date(date.getTime());
        this.operation = operation || "";
        this.parameters = parameters || "";

    }
}

module.exports = EliteEventData;