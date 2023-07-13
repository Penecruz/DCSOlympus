import { LatLng } from "leaflet";
import { getActiveCoalition, getMap, getMissionHandler, getUnitsManager, setActiveCoalition } from "..";
import { spawnExplosion, spawnSmoke } from "../server/server";
import { aircraftDatabase } from "../units/aircraftdatabase";
import { groundUnitDatabase } from "../units/groundunitdatabase";
import { helicopterDatabase } from "../units/helicopterdatabase";
import { ContextMenu } from "./contextmenu";
import { Dropdown } from "./dropdown";
import { Switch } from "./switch";
import { Slider } from "./slider";
import { ftToM } from "../other/utils";
import { GAME_MASTER } from "../constants/constants";
import { navyUnitDatabase } from "../units/navyunitdatabase";
import { CoalitionArea } from "../map/coalitionarea";

export class MapContextMenu extends ContextMenu {
    #coalitionSwitch: Switch;
    #aircraftRoleDropdown: Dropdown;
    #aircraftLabelDropdown: Dropdown;
    #aircraftCountDropdown: Dropdown;
    #aircraftLoadoutDropdown: Dropdown;
    #aircraftSpawnAltitudeSlider: Slider;
    #helicopterRoleDropdown: Dropdown;
    #helicopterLabelDropdown: Dropdown;
    #helicopterCountDropdown: Dropdown;
    #helicopterLoadoutDropdown: Dropdown;
    #helicopterSpawnAltitudeSlider: Slider;
    #groundUnitTypeDropdown: Dropdown;
    #groundUnitLabelDropdown: Dropdown;
    #groundUnitCountDropdown: Dropdown;
    #navyUnitTypeDropdown: Dropdown;
    #navyUnitLabelDropdown: Dropdown;
    #navyUnitCountDropdown: Dropdown;
    #spawnOptions = { role: "", name: "", latlng: new LatLng(0, 0), coalition: "blue", loadout: "", airbaseName: "", altitude: 0, count: 1 };
    #coalitionArea: CoalitionArea | null = null;

    constructor(id: string) {
        super(id);

        this.#coalitionSwitch = new Switch("coalition-switch", (value: boolean) => this.#onSwitchClick(value));
        this.#coalitionSwitch.setValue(false);
        this.#coalitionSwitch.getContainer()?.addEventListener("contextmenu", (e) => this.#onSwitchRightClick(e));

        /* Aircraft menu */
        this.#aircraftRoleDropdown = new Dropdown("aircraft-role-options", (role: string) => this.#setAircraftRole(role));
        this.#aircraftLabelDropdown = new Dropdown("aircraft-label-options", (type: string) => this.#setAircraftLabel(type));
        this.#aircraftCountDropdown = new Dropdown("aircraft-count-options", (type: string) => this.#setAircraftCount(type));
        this.#aircraftCountDropdown.setOptions(["1", "2", "3", "4"]);
        this.#aircraftCountDropdown.setValue("1");
        this.#aircraftLoadoutDropdown = new Dropdown("aircraft-loadout-options", (loadout: string) => this.#setAircraftLoadout(loadout));
        this.#aircraftSpawnAltitudeSlider = new Slider("aircraft-spawn-altitude-slider", 0, 50000, "ft", (value: number) => {this.#spawnOptions.altitude = ftToM(value);});
        this.#aircraftSpawnAltitudeSlider.setIncrement(500);
        this.#aircraftSpawnAltitudeSlider.setValue(20000);
        this.#aircraftSpawnAltitudeSlider.setActive(true);

        /* Helicopter menu */
        this.#helicopterRoleDropdown = new Dropdown("helicopter-role-options", (role: string) => this.#setHelicopterRole(role));
        this.#helicopterLabelDropdown = new Dropdown("helicopter-label-options", (type: string) => this.#setHelicopterLabel(type));
        this.#helicopterCountDropdown = new Dropdown("helicopter-count-options", (type: string) => this.#setHelicopterCount(type));
        this.#helicopterCountDropdown.setOptions(["1", "2", "3", "4"]);
        this.#helicopterCountDropdown.setValue("1");
        this.#helicopterLoadoutDropdown = new Dropdown("helicopter-loadout-options", (loadout: string) => this.#setHelicopterLoadout(loadout));
        this.#helicopterSpawnAltitudeSlider = new Slider("helicopter-spawn-altitude-slider", 0, 10000, "ft", (value: number) => {this.#spawnOptions.altitude = ftToM(value);});
        this.#helicopterSpawnAltitudeSlider.setIncrement(50);
        this.#helicopterSpawnAltitudeSlider.setValue(5000);
        this.#helicopterSpawnAltitudeSlider.setActive(true);

        var count = [];
        for (let i = 1; i < 10; i++) count.push(String(i));

        /* Ground unit menu */
        this.#groundUnitTypeDropdown = new Dropdown("groundunit-type-options", (type: string) => this.#setGroundUnitType(type));
        this.#groundUnitLabelDropdown = new Dropdown("groundunit-label-options", (name: string) => this.#setGroundUnitLabel(name));
        this.#groundUnitCountDropdown = new Dropdown("groundunit-count-options", (count: string) => this.#setGroundUnitCount(count));
        this.#groundUnitCountDropdown.setOptions(count);
        this.#groundUnitCountDropdown.setValue("1");

        /* Navy unit menu */
        this.#navyUnitTypeDropdown = new Dropdown("navyunit-type-options", (type: string) => this.#setNavyUnitType(type));
        this.#navyUnitLabelDropdown = new Dropdown("navyunit-label-options", (name: string) => this.#setNavyUnitLabel(name));
        this.#navyUnitCountDropdown = new Dropdown("navyunit-count-options", (count: string) => this.#setNavyUnitCount(count));
        this.#navyUnitCountDropdown.setOptions(count);
        this.#navyUnitCountDropdown.setValue("1");

        document.addEventListener("mapContextMenuShow", (e: any) => {
            if (this.getVisibleSubMenu() !== e.detail.type)
                this.showSubMenu(e.detail.type);
            else 
                this.hideSubMenus(e.detail.type);
        });

        document.addEventListener("contextMenuDeployAircrafts", () => {
            
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng, altitude: this.#spawnOptions.altitude, loadout: this.#spawnOptions.loadout};
                var units = [];
                for (let i = 1; i < parseInt(this.#aircraftCountDropdown.getValue()) + 1; i++) {
                    units.push(unitTable);
                }
                if (getUnitsManager().spawnUnits("Aircraft", units, getActiveCoalition(), false, this.#spawnOptions.airbaseName)) {
                    getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                    this.hide();
                }
            }
        });

        document.addEventListener("contextMenuDeployHelicopters", () => {
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng, altitude: this.#spawnOptions.altitude, loadout: this.#spawnOptions.loadout};
                var units = [];
                for (let i = 1; i < parseInt(this.#helicopterCountDropdown.getValue()) + 1; i++) {
                    units.push(unitTable);
                }
                if (getUnitsManager().spawnUnits("Helicopter", units, getActiveCoalition(), false, this.#spawnOptions.airbaseName)) {
                    getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                    this.hide();
                }
            }
        });

        document.addEventListener("contextMenuDeployGroundUnits", () => {
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng};
                var units = [];
                for (let i = 1; i < parseInt(this.#groundUnitCountDropdown.getValue()) + 1; i++) {
                    units.push(JSON.parse(JSON.stringify(unitTable)));
                    unitTable.location.lat += 0.0001;
                }
                if (getUnitsManager().spawnUnits("GroundUnit", units, getActiveCoalition(), false)) {
                    getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                    this.hide();
                }
            }
        });

        document.addEventListener("contextMenuDeployNavyUnits", () => {
            this.#spawnOptions.coalition = getActiveCoalition();
            if (this.#spawnOptions) {
                var unitTable = {unitType: this.#spawnOptions.name, location: this.#spawnOptions.latlng};
                var units = [];
                for (let i = 1; i < parseInt(this.#navyUnitCountDropdown.getValue()) + 1; i++) {
                    units.push(JSON.parse(JSON.stringify(unitTable)));
                    unitTable.location.lat += 0.0001;
                }
                if (getUnitsManager().spawnUnits("NavyUnit", units, getActiveCoalition(), false)) {
                    getMap().addTemporaryMarker(this.#spawnOptions.latlng, this.#spawnOptions.name, getActiveCoalition());
                    this.hide();
                }
            }
        });

        document.addEventListener("contextMenuDeploySmoke", (e: any) => {
            this.hide();
            spawnSmoke(e.detail.color, this.getLatLng());
        });

        document.addEventListener("contextMenuExplosion", (e: any) => {
            this.hide();
            spawnExplosion(e.detail.strength, this.getLatLng());
        });
        
        document.addEventListener("editCoalitionArea", (e: any) => {
            this.hide();
            if (this.#coalitionArea) {
                getMap().deselectAllCoalitionAreas();
                this.#coalitionArea.setSelected(true);
            }
        });

        document.addEventListener("RTSOptionsChanged", (e: any) => {
            this.#refreshOptions();
        });

        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        super.show(x, y, latlng);
        this.showUpperBar();

        this.showAltitudeSlider();

        this.#spawnOptions.airbaseName = "";
        this.#spawnOptions.latlng = latlng;

        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
        if (getActiveCoalition() == "blue")
            this.#coalitionSwitch.setValue(false);
        else if (getActiveCoalition() == "red")
            this.#coalitionSwitch.setValue(true);
        else
            this.#coalitionSwitch.setValue(undefined);

        if (getUnitsManager().getCommandMode() !== GAME_MASTER)
            this.#coalitionSwitch.hide()

        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", true);
    }

    showSubMenu(type: string) {
        if (type === "more")
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide");
        else if (["aircraft", "groundunit"].includes(type))
            this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", true);

        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", type !== "aircraft");
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", type === "aircraft");
        this.getContainer()?.querySelector("#helicopter-spawn-menu")?.classList.toggle("hide", type !== "helicopter");
        this.getContainer()?.querySelector("#helicopter-spawn-button")?.classList.toggle("is-open", type === "helicopter");
        this.getContainer()?.querySelector("#groundunit-spawn-menu")?.classList.toggle("hide", type !== "groundunit");
        this.getContainer()?.querySelector("#groundunit-spawn-button")?.classList.toggle("is-open", type === "groundunit");
        this.getContainer()?.querySelector("#navyunit-spawn-menu")?.classList.toggle("hide", type !== "navyunit");
        this.getContainer()?.querySelector("#navyunit-spawn-button")?.classList.toggle("is-open", type === "navyunit");
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", type !== "smoke");
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", type === "smoke");
        this.getContainer()?.querySelector("#explosion-menu")?.classList.toggle("hide", type !== "explosion");
        this.getContainer()?.querySelector("#explosion-spawn-button")?.classList.toggle("is-open", type === "explosion");

        this.#resetAircraftRole();
        this.#resetAircraftLabel();
        this.#resetHelicopterRole();
        this.#resetHelicopterLabel();
        this.#resetGroundUnitType();
        this.#resetGroundUnitLabel();
        this.#resetNavyUnitType();
        this.#resetNavyUnitLabel();
        this.#aircraftCountDropdown.setValue("1");
        this.#helicopterCountDropdown.setValue("1");
        this.#groundUnitCountDropdown.setValue("1");
        this.clip();

        if (type === "aircraft") {
            this.#spawnOptions.altitude = ftToM(this.#aircraftSpawnAltitudeSlider.getValue());
        }
        else if (type === "helicopter") {
            this.#spawnOptions.altitude = ftToM(this.#helicopterSpawnAltitudeSlider.getValue());
        }

        this.setVisibleSubMenu(type);
    }

    hideSubMenus(type: string) {
        this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", ["aircraft", "groundunit"].includes(type));
        this.getContainer()?.querySelector("#aircraft-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#aircraft-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#helicopter-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#helicopter-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#groundunit-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#groundunit-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#navyunit-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#navyunit-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#smoke-spawn-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#smoke-spawn-button")?.classList.toggle("is-open", false);
        this.getContainer()?.querySelector("#explosion-menu")?.classList.toggle("hide", true);
        this.getContainer()?.querySelector("#explosion-spawn-button")?.classList.toggle("is-open", false);

        this.#resetAircraftRole();
        this.#resetAircraftLabel();
        this.#resetHelicopterRole();
        this.#resetHelicopterLabel();
        this.#resetHelicopterRole();
        this.#resetHelicopterLabel();
        this.#resetGroundUnitType();
        this.#resetGroundUnitLabel();
        this.#resetNavyUnitType();
        this.#resetNavyUnitLabel();
        this.clip();

        this.setVisibleSubMenu(null);
    }

    showUpperBar() {
        this.getContainer()?.querySelector(".upper-bar")?.classList.toggle("hide", false);
    }

    hideUpperBar() {
        this.getContainer()?.querySelector(".upper-bar")?.classList.toggle("hide", true);
    }

    showLowerBar() {
        this.getContainer()?.querySelector("#more-options-button-bar")?.classList.toggle("hide", false);
    }

    hideLowerBar() {
        this.getContainer()?.querySelector("#more-optionsbutton-bar")?.classList.toggle("hide", true);
    }

    showAltitudeSlider() {
        this.getContainer()?.querySelector("#aircraft-spawn-altitude-slider")?.classList.toggle("hide", false);
    }

    hideAltitudeSlider() {
        this.getContainer()?.querySelector("#aircraft-spawn-altitude-slider")?.classList.toggle("hide", true);
    }

    setAirbaseName(airbaseName: string) {
        this.#spawnOptions.airbaseName = airbaseName;
    }

    setLatLng(latlng: LatLng) {
        this.#spawnOptions.latlng = latlng;
    }

    setCoalitionArea(coalitionArea: CoalitionArea) {
        this.#coalitionArea = coalitionArea;
        this.getContainer()?.querySelector("#coalition-area-button")?.classList.toggle("hide", false);
    }

    #onSwitchClick(value: boolean) {
        value? setActiveCoalition("red"): setActiveCoalition("blue");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
    }

    #onSwitchRightClick(e: any) {
        this.#coalitionSwitch.setValue(undefined);
        setActiveCoalition("neutral");
        this.getContainer()?.querySelectorAll('[data-coalition]').forEach((element: any) => { element.setAttribute("data-coalition", getActiveCoalition()) });
    }

    #refreshOptions() {
        if (!aircraftDatabase.getRoles().includes(this.#aircraftRoleDropdown.getValue())) 
            this.#resetAircraftRole();
        if (!aircraftDatabase.getByRole(this.#aircraftRoleDropdown.getValue()).map((blueprint) => { return blueprint.label }).includes(this.#aircraftLabelDropdown.getValue())) 
            this.#resetAircraftLabel();

        if (!helicopterDatabase.getRoles().includes(this.#helicopterRoleDropdown.getValue())) 
            this.#resetHelicopterRole();
        if (!helicopterDatabase.getByRole(this.#helicopterRoleDropdown.getValue()).map((blueprint) => { return blueprint.label }).includes(this.#helicopterLabelDropdown.getValue())) 
            this.#resetHelicopterLabel();

        if (!groundUnitDatabase.getRoles().includes(this.#groundUnitTypeDropdown.getValue())) 
            this.#resetGroundUnitType();
        if (!groundUnitDatabase.getByType(this.#groundUnitTypeDropdown.getValue()).map((blueprint) => { return blueprint.label }).includes(this.#groundUnitLabelDropdown.getValue())) 
            this.#resetGroundUnitLabel();

        if (!navyUnitDatabase.getRoles().includes(this.#navyUnitTypeDropdown.getValue())) 
            this.#resetNavyUnitType();
        if (!navyUnitDatabase.getByType(this.#navyUnitTypeDropdown.getValue()).map((blueprint) => { return blueprint.label }).includes(this.#aircraftLabelDropdown.getValue())) 
            this.#resetNavyUnitLabel();
    }

    /********* Aircraft spawn menu *********/
    #setAircraftRole(role: string) {
        this.#spawnOptions.role = role;
        this.#resetAircraftLabel();
        this.#aircraftLabelDropdown.setOptions(aircraftDatabase.getByRole(role).map((blueprint) => { return blueprint.label }));
        this.#aircraftLabelDropdown.selectValue(0);
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetAircraftRole() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-loadout-list")).replaceChildren();
        this.#aircraftRoleDropdown.reset();
        this.#aircraftLabelDropdown.reset();
        this.#aircraftRoleDropdown.setOptions(aircraftDatabase.getRoles());
        this.clip();
    }

    #setAircraftLabel(label: string) {
        this.#resetAircraftLabel();
        var name = aircraftDatabase.getByLabel(label)?.name || null;
        if (name != null) {
            this.#spawnOptions.name = name;
            this.#aircraftLoadoutDropdown.setOptions(aircraftDatabase.getLoadoutNamesByRole(name, this.#spawnOptions.role));
            this.#aircraftLoadoutDropdown.selectValue(0);
            var image = (<HTMLImageElement>this.getContainer()?.querySelector("#aircraft-unit-image"));
            image.src = `images/units/${aircraftDatabase.getByLabel(label)?.filename}`;
            image.classList.toggle("hide", false);
        }
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetAircraftLabel() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-loadout-list")).replaceChildren();
        this.#aircraftLoadoutDropdown.reset();
        (<HTMLImageElement>this.getContainer()?.querySelector("#aircraft-unit-image")).classList.toggle("hide", true);
        this.clip();
    }

    #setAircraftCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
        this.#computeSpawnPoints();
    }

    #setAircraftLoadout(loadoutName: string) {
        var loadout = aircraftDatabase.getLoadoutByName(this.#spawnOptions.name, loadoutName);
        if (loadout) {
            this.#spawnOptions.loadout = loadout.code;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
            var items = loadout.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            items.length == 0 ? items.push("Empty loadout") : "";
            (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-loadout-list")).replaceChildren(
                ...items.map((item: any) => {
                    var div = document.createElement('div');
                    div.innerText = item;
                    return div;
                })
            )
        }
        this.clip();
    }

    /********* Helicopter spawn menu *********/
    #setHelicopterRole(role: string) {
        this.#spawnOptions.role = role;
        this.#resetHelicopterLabel();
        this.#helicopterLabelDropdown.setOptions(helicopterDatabase.getByRole(role).map((blueprint) => { return blueprint.label }));
        this.#helicopterLabelDropdown.selectValue(0);
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetHelicopterRole() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-loadout-list")).replaceChildren();
        this.#helicopterRoleDropdown.reset();
        this.#helicopterLabelDropdown.reset();
        this.#helicopterRoleDropdown.setOptions(helicopterDatabase.getRoles());
        this.clip();
    }

    #setHelicopterLabel(label: string) {
        this.#resetHelicopterLabel();
        var name = helicopterDatabase.getByLabel(label)?.name || null;
        if (name != null) {
            this.#spawnOptions.name = name;
            this.#helicopterLoadoutDropdown.setOptions(helicopterDatabase.getLoadoutNamesByRole(name, this.#spawnOptions.role));
            this.#helicopterLoadoutDropdown.selectValue(0);
            var image = (<HTMLImageElement>this.getContainer()?.querySelector("#helicopter-unit-image"));
            image.src = `images/units/${helicopterDatabase.getByLabel(label)?.filename}`;
            image.classList.toggle("hide", false);
        }
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetHelicopterLabel() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-loadout-list")).replaceChildren();
        this.#helicopterLoadoutDropdown.reset();
        (<HTMLImageElement>this.getContainer()?.querySelector("#helicopter-unit-image")).classList.toggle("hide", true);
        this.clip();
    }

    #setHelicopterCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
        this.#computeSpawnPoints();
    }

    #setHelicopterLoadout(loadoutName: string) {
        var loadout = helicopterDatabase.getLoadoutByName(this.#spawnOptions.name, loadoutName);
        if (loadout) {
            this.#spawnOptions.loadout = loadout.code;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
            var items = loadout.items.map((item: any) => { return `${item.quantity}x ${item.name}`; });
            items.length == 0 ? items.push("Empty loadout") : "";
            (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-loadout-list")).replaceChildren(
                ...items.map((item: any) => {
                    var div = document.createElement('div');
                    div.innerText = item;
                    return div;
                })
            )
        }
        this.clip();
    }

    /********* Groundunit spawn menu *********/
    #setGroundUnitType(role: string) {
        this.#resetGroundUnitLabel();

        const types = groundUnitDatabase.getByType(role).map((blueprint) => { return blueprint.label });
        this.#groundUnitLabelDropdown.setOptions(types);
        this.#groundUnitLabelDropdown.selectValue(0);
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetGroundUnitType() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.#groundUnitTypeDropdown.reset();
        this.#groundUnitLabelDropdown.reset();

        const types = groundUnitDatabase.getTypes();
        this.#groundUnitTypeDropdown.setOptions(types);
        this.clip();
    }

    #setGroundUnitLabel(label: string) {
        this.#resetGroundUnitLabel();
        var type = groundUnitDatabase.getByLabel(label)?.name || null;
        if (type != null) {
            this.#spawnOptions.name = type;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
        }
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetGroundUnitLabel() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.clip();
    }

    #setGroundUnitCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
        this.#computeSpawnPoints();
    }

    /********* Navyunit spawn menu *********/
    #setNavyUnitType(role: string) {
        this.#resetNavyUnitLabel();

        const types = navyUnitDatabase.getByType(role).map((blueprint) => { return blueprint.label });
        this.#navyUnitLabelDropdown.setOptions(types);
        this.#navyUnitLabelDropdown.selectValue(0);
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetNavyUnitType() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.#navyUnitTypeDropdown.reset();
        this.#navyUnitLabelDropdown.reset();

        const types = navyUnitDatabase.getTypes();
        this.#navyUnitTypeDropdown.setOptions(types);
        this.clip();
    }

    #setNavyUnitLabel(label: string) {
        this.#resetNavyUnitLabel();
        var type = navyUnitDatabase.getByLabel(label)?.name || null;
        if (type != null) {
            this.#spawnOptions.name = type;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = false;
        }
        this.clip();
        this.#computeSpawnPoints();
    }

    #resetNavyUnitLabel() {
        (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = true;
        this.clip();
    }

    #setNavyUnitCount(count: string) {
        this.#spawnOptions.count = parseInt(count);
        this.clip();
        this.#computeSpawnPoints();
    }

    #computeSpawnPoints() {
        if (getMissionHandler()){
            var aircraftCount = parseInt(this.#aircraftCountDropdown.getValue());
            var aircraftSpawnPoints = aircraftCount * aircraftDatabase.getSpawnPointsByLabel(this.#aircraftLabelDropdown.getValue());
            (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).dataset.points = `${aircraftSpawnPoints}`;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#aircraft-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = aircraftSpawnPoints > getMissionHandler().getAvailableSpawnPoints();
        
            var helicopterCount = parseInt(this.#helicopterCountDropdown.getValue());
            var helicopterSpawnPoints = helicopterCount * helicopterDatabase.getSpawnPointsByLabel(this.#helicopterLabelDropdown.getValue());
            (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).dataset.points = `${helicopterSpawnPoints}`;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#helicopter-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = helicopterSpawnPoints > getMissionHandler().getAvailableSpawnPoints();

            var groundUnitCount = parseInt(this.#groundUnitCountDropdown.getValue());
            var groundUnitSpawnPoints = groundUnitCount * groundUnitDatabase.getSpawnPointsByLabel(this.#groundUnitLabelDropdown.getValue());
            (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).dataset.points = `${groundUnitSpawnPoints}`;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#groundunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = groundUnitSpawnPoints > getMissionHandler().getAvailableSpawnPoints();

            var navyUnitCount = parseInt(this.#navyUnitCountDropdown.getValue());
            var navyUnitSpawnPoints = navyUnitCount * navyUnitDatabase.getSpawnPointsByLabel(this.#navyUnitLabelDropdown.getValue());
            (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).dataset.points = `${navyUnitSpawnPoints}`;
            (<HTMLButtonElement>this.getContainer()?.querySelector("#navyunit-spawn-menu")?.querySelector(".deploy-unit-button")).disabled = navyUnitSpawnPoints > getMissionHandler().getAvailableSpawnPoints();
        }
    }
}