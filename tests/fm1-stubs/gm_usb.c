/* SPDX-License-Identifier: GPL-3.0-only; mock transport flags only. */
static struct {unsigned uboot_req,ota_req;} usb;
static void usb_detach(void){detached++;}
