import { LatLng } from "leaflet";

export class ContextMenu {
    #container: HTMLElement | null;
    #latlng: LatLng = new LatLng(0, 0);
    #x: number = 0;
    #y: number = 0;
    #visibleSubMenu: string | null = null;
    #hidden: boolean = true;

    constructor(id: string) {
        this.#container = document.getElementById(id);
        this.hide();
    }

    show(x: number, y: number, latlng: LatLng) {
        this.#latlng = latlng;
        this.#container?.classList.toggle("hide", false);
        this.#x = x;
        this.#y = y;
        this.clip();
        this.#hidden = false;
    }

    hide() {
        this.#container?.classList.toggle("hide", true);
        this.#hidden = true;
    }

    getContainer() {
        return this.#container;
    }

    getLatLng() {
        return this.#latlng;
    }

    getX() {
        return this.#x;
    }

    getY() {
        return this.#y;
    }

    getHidden() {
        return this.#hidden;
    }

    clip() {
        if (this.#container != null) {
            if (this.#x + this.#container.offsetWidth < window.innerWidth)
                this.#container.style.left = this.#x + "px";
            else
                this.#container.style.left = window.innerWidth - this.#container.offsetWidth - 10 + "px";

            if (this.#y + this.#container.offsetHeight < window.innerHeight)
                this.#container.style.top = this.#y + "px";
            else
                this.#container.style.top = window.innerHeight - this.#container.offsetHeight - 10 + "px";
        }
    }

    setVisibleSubMenu(menu: string | null) {
        this.#visibleSubMenu = menu;
    }

    getVisibleSubMenu() {
        return this.#visibleSubMenu;
    }
}