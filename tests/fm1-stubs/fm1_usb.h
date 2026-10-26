/* SPDX-License-Identifier: GPL-3.0-only; USB registers are absent in this host test. */
static void fm1_usb_reset(void){}
static void fm1_delay_ms(unsigned n){(void)n;}
static void fm1_usb_attach(void *p){(void)p;}
static void fm1_usb_off(void){}
static void fm1_usb_ep0_buf(void *p){(void)p;}
static void fm1_usb_ep0_send(void *p,unsigned n){(void)p;(void)n;}
static void fm1_usb_ep_send(unsigned e,void *p,unsigned n){(void)e;(void)p;(void)n;}
static void fm1_usb_ep_txbuf(unsigned e,void *p){(void)e;(void)p;}
static void fm1_usb_ep_rxbuf(unsigned e,void *p){(void)e;(void)p;}
static void fm1_usb_ep_enable(unsigned n){(void)n;}
static void fm1_usb_rx_sync(void){}
static unsigned fm1_usb_sie_on(void){return 0;}
static void fm1_usb_sie_wr_start(unsigned r,unsigned v){(void)r;(void)v;}
static void fm1_usb_sie_rd_start(unsigned r){(void)r;}
static unsigned fm1_usb_sie_done(void){return 1;}
static unsigned fm1_usb_sie_data(void){return 0;}
static unsigned fm1_usb_sof_take(void){return 0;}
