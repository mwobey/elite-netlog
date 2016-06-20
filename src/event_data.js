
class EliteEventData {
    constructor(h, m, s, operation, parameters) {
        this.h = h || Number.MIN_SAFE_INTEGER;
        this.m = m || Number.MIN_SAFE_INTEGER;
        this.s = s || Number.MIN_SAFE_INTEGER;
        this.operation = operation || "";
        this.parameters = arguments || "";

    }
}

module.exports = EliteEventData;