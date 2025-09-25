"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useSPARouter } from "@/hooks/useSPARouter";

export const MarketBatchListInput: React.FC = () => {
    const { t } = useTranslation();
    const { navigateWithParams } = useSPARouter();

    const FormSchema = z.object({
        typeList: z.string(),
    });

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    const parseTypeList = (input: string): { typeId: number; amount: number }[] => {
        const _lines = input.split("\n");
        const result: { typeId: number; amount: number }[] = [];

        return result;
    };

    const onSubmit = (data: z.infer<typeof FormSchema>) => {
        console.log(data.typeList);
        const _typeList = parseTypeList(data.typeList);
        navigateWithParams("/market/batch-list/table", {
            typeList: [
                {
                    typeId: 34,
                    amount: 1000,
                },
                {
                    typeId: 582,
                    amount: 10,
                },
                {
                    typeId: 583,
                    amount: 5,
                },
                {
                    typeId: 11987,
                    amount: 7,
                },
            ],
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3">
                <FormField
                    control={form.control}
                    name="typeList"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("market.batch_list.input.label")}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t("market.batch_list.input.placeholder")}
                                    className="resize w-[640px] h-72"
                                    {...field}
                                    autoFocus
                                />
                            </FormControl>
                            <FormDescription>{t("market.batch_list.input.hint")}</FormDescription>
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-fit">
                    {t("market.batch_list.input.submit")}
                </Button>
            </form>
        </Form>
    );
};
