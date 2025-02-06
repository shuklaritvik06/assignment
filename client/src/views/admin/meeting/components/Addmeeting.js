import { Button, Flex, FormLabel, Grid, GridItem, IconButton, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Radio, RadioGroup, Stack, Text, Textarea } from '@chakra-ui/react';
import { CUIAutoComplete } from 'chakra-ui-autocomplete';
import { useFormik } from 'formik';
import { useEffect, useState } from 'react';
import { LiaMousePointerSolid } from 'react-icons/lia';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { MeetingSchema } from 'schema';
import { getApi, postApi } from 'services/api';
import MultiContactModel from 'components/commonTableModel/MultiContactModel';
import MultiLeadModel from 'components/commonTableModel/MultiLeadModel';
import Spinner from 'components/spinner/Spinner';
import dayjs from 'dayjs';

const AddMeeting = ({ onClose, isOpen, setAction, from, fetchData, view, leadContect, id }) => {
    const [leaddata, setLeadData] = useState([]);
    const [contactdata, setContactData] = useState([]);
    const [isLoding, setIsLoding] = useState(false);
    const [contactModelOpen, setContactModel] = useState(false);
    const [leadModelOpen, setLeadModel] = useState(false);
    const todayTime = new Date().toISOString().split('.')[0];

    const user = JSON.parse(localStorage.getItem('user'));
    const leadData = useSelector((state) => state?.leadData?.data);
    const contactList = useSelector((state) => state?.contactData?.data);

    const initialValues = {
        agenda: '',
        attendes: leadContect === 'contactView' && id ? [id] : [],
        attendesLead: leadContect === 'leadView' && id ? [id] : [],
        location: '',
        related: leadContect === 'contactView' ? 'Contact' : leadContect === 'leadView' ? 'Lead' : 'None',
        dateTime: '',
        notes: '',
        createBy: user?._id,
    };

    const formik = useFormik({
        initialValues,
        validationSchema: MeetingSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                setIsLoding(true);
                const meetingData = {
                    ...values,
                    createBy: user?._id,
                    timestamp: new Date(),
                    deleted: false
                };

                const response = await postApi('api/meeting/add', meetingData);

                if (response.status === 200) {
                    toast.success('Meeting created successfully');
                    resetForm();
                    setAction(prev => !prev);
                    onClose();
                } else {
                    throw new Error(response?.data?.error || 'Failed to create meeting');
                }
            } catch (error) {
                toast.error(error.message || 'Error creating meeting');
            } finally {
                setIsLoding(false);
            }
        },
    });

    const { errors, touched, values, handleBlur, handleChange, handleSubmit, setFieldValue } = formik;

    const fetchAllData = async () => {
        try {
            if (values.related === "Contact") {
                if (!contactList?.length) {
                    const response = await getApi('api/contact/list');
                    if (response.status === 200) {
                        setContactData(response.data);
                    }
                } else {
                    setContactData(contactList);
                }
            } else if (values.related === "Lead") {
                if (!leadData?.length) {
                    const response = await getApi('api/lead/list');
                    if (response.status === 200) {
                        setLeadData(response.data);
                    }
                } else {
                    setLeadData(leadData);
                }
            }
        } catch (error) {
            toast.error('Error fetching attendee data');
        }
    };

    useEffect(() => {
        if (values.related && values.related !== 'None') {
            fetchAllData();
        }
    }, [id, values.related, contactList, leadData]);

    const extractLabels = (selectedItems) => selectedItems.map((item) => item._id);

    const countriesWithEmailAsLabel = (values.related === "Contact" ? contactdata : leaddata)?.map((item) => ({
        ...item,
        value: item._id,
        label: values.related === "Contact" ? `${item.firstName} ${item.lastName}` : item.leadName,
    }));

    return (
        <Modal onClose={onClose} isOpen={isOpen} isCentered>
            <ModalOverlay />
            <ModalContent height={"580px"}>
                <ModalHeader>Add Meeting</ModalHeader>
                <ModalCloseButton />
                <ModalBody overflowY={"auto"} height={"400px"}>
                    <MultiContactModel
                        data={contactdata}
                        isOpen={contactModelOpen}
                        onClose={setContactModel}
                        fieldName='attendes'
                        setFieldValue={setFieldValue}
                    />
                    <MultiLeadModel
                        data={leaddata}
                        isOpen={leadModelOpen}
                        onClose={setLeadModel}
                        fieldName='attendesLead'
                        setFieldValue={setFieldValue}
                    />

                    <Grid templateColumns="repeat(12, 1fr)" gap={3}>
                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Agenda<Text color={"red"}>*</Text>
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.agenda}
                                name="agenda"
                                placeholder='Agenda'
                                fontWeight='500'
                                borderColor={errors.agenda && touched.agenda ? "red.300" : null}
                            />
                            <Text fontSize='sm' mb='10px' color={'red'}>
                                {errors.agenda && touched.agenda && errors.agenda}
                            </Text>
                        </GridItem>

                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Related To<Text color={"red"}>*</Text>
                            </FormLabel>
                            <RadioGroup onChange={(e) => setFieldValue('related', e)} value={values.related}>
                                <Stack direction='row'>
                                    {leadContect === 'contactView' && <Radio value='Contact'>Contact</Radio>}
                                    {leadContect === 'leadView' && <Radio value='Lead'>Lead</Radio>}
                                    {!leadContect && (
                                        <>
                                            <Radio value='Contact'>Contact</Radio>
                                            <Radio value='Lead'>Lead</Radio>
                                        </>
                                    )}
                                </Stack>
                            </RadioGroup>
                            <Text mb='10px' color={'red'} fontSize='sm'>
                                {errors.related && touched.related && errors.related}
                            </Text>
                        </GridItem>

                        {(values.related === "Contact" ? (contactdata?.length ?? 0) > 0 : (leaddata?.length ?? 0) > 0) && values.related && (
                            <GridItem colSpan={{ base: 12 }}>
                                <Flex alignItems={'end'} justifyContent={'space-between'}>
                                    <Text w={'100%'}>
                                        <CUIAutoComplete
                                            label={`Choose Preferred Attendes ${values.related === "Contact" ? "Contact" : "Lead"}`}
                                            placeholder="Type a Name"
                                            name="attendes"
                                            items={countriesWithEmailAsLabel}
                                            className='custom-autoComplete'
                                            selectedItems={countriesWithEmailAsLabel?.filter((item) =>
                                                values.related === "Contact"
                                                    ? values?.attendes.includes(item._id)
                                                    : values?.attendesLead.includes(item._id)
                                            )}
                                            onSelectedItemsChange={(changes) => {
                                                const selectedLabels = extractLabels(changes.selectedItems);
                                                values.related === "Contact"
                                                    ? setFieldValue('attendes', selectedLabels)
                                                    : setFieldValue('attendesLead', selectedLabels);
                                            }}
                                        />
                                    </Text>
                                    <IconButton
                                        mb={6}
                                        onClick={() => values.related === "Contact" ? setContactModel(true) : setLeadModel(true)}
                                        fontSize='25px'
                                        icon={<LiaMousePointerSolid />}
                                    />
                                </Flex>
                                <Text color={'red'}>
                                    {errors.attendes && touched.attendes && errors.attendes}
                                </Text>
                            </GridItem>
                        )}

                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Location
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.location}
                                name="location"
                                placeholder='Location'
                                fontWeight='500'
                                borderColor={errors.location && touched.location ? "red.300" : null}
                            />
                            <Text mb='10px' color={'red'}>
                                {errors.location && touched.location && errors.location}
                            </Text>
                        </GridItem>

                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Date Time<Text color={"red"}>*</Text>
                            </FormLabel>
                            <Input
                                fontSize='sm'
                                type='datetime-local'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                min={dayjs(todayTime).format('YYYY-MM-DD HH:mm')}
                                value={values.dateTime}
                                name="dateTime"
                                placeholder='Date Time'
                                fontWeight='500'
                                borderColor={errors.dateTime && touched.dateTime ? "red.300" : null}
                            />
                            <Text fontSize='sm' mb='10px' color={'red'}>
                                {errors.dateTime && touched.dateTime && errors.dateTime}
                            </Text>
                        </GridItem>

                        <GridItem colSpan={{ base: 12 }}>
                            <FormLabel display='flex' ms='4px' fontSize='sm' fontWeight='500' mb='8px'>
                                Notes
                            </FormLabel>
                            <Textarea
                                resize={'none'}
                                fontSize='sm'
                                placeholder='Notes'
                                onChange={handleChange}
                                onBlur={handleBlur}
                                value={values.notes}
                                name="notes"
                                fontWeight='500'
                                borderColor={errors.notes && touched.notes ? "red.300" : null}
                            />
                            <Text mb='10px' color={'red'}>
                                {errors.notes && touched.notes && errors.notes}
                            </Text>
                        </GridItem>
                    </Grid>
                </ModalBody>
                <ModalFooter>
                    <Button
                        size="sm"
                        variant="brand"
                        me={2}
                        disabled={isLoding}
                        onClick={handleSubmit}
                    >
                        {isLoding ? <Spinner /> : 'Save'}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => {
                            formik.resetForm();
                            onClose();
                        }}
                    >
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default AddMeeting;
