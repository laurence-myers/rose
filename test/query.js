"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
// import {describe, it} from "mocha";
const metamodel_1 = require("../src/query/metamodel");
const dsl_1 = require("../src/query/dsl");
describe("Query DSL", function () {
    it("produces SQL", function () {
        let QUsers_1 = class QUsers {
            constructor() {
            }
        };
        let QUsers = QUsers_1;
        QUsers.id = new metamodel_1.NumericColumnMetamodel(QUsers, "id", Number);
        QUsers.locationId = new metamodel_1.NumericColumnMetamodel(QUsers, "id", Number);
        QUsers = QUsers_1 = __decorate([
            metamodel_1.Table(new metamodel_1.TableMetamodel("Users")), 
            __metadata('design:paramtypes', [])
        ], QUsers);
        let QLocations_1 = class QLocations {
            constructor() {
            }
        };
        let QLocations = QLocations_1;
        QLocations.id = new metamodel_1.NumericColumnMetamodel(QLocations, "id", Number);
        QLocations = QLocations_1 = __decorate([
            metamodel_1.Table(new metamodel_1.TableMetamodel("Locations")), 
            __metadata('design:paramtypes', [])
        ], QLocations);
        class QuerySelect {
        }
        __decorate([
            metamodel_1.Column(QUsers.id), 
            __metadata('design:type', Number)
        ], QuerySelect.prototype, "id", void 0);
        const result = dsl_1.select(QuerySelect).where(QUsers.id.eq(1));
        console.log(result.toSql());
    });
});
