import { useEffect, useState } from 'react';
import { DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { Button, Menu, MenuButton, MenuItem, MenuList, Text, useDisclosure } from '@chakra-ui/react';
import { HasAccess } from '../../../redux/accessUtils';
import { SearchIcon } from "@chakra-ui/icons";
import { CiMenuKebab } from 'react-icons/ci';
import { deleteManyApi } from 'services/api';
import { toast } from 'react-toastify';
import { fetchMeetingData } from '../../../redux/slices/meetingSlice';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import MeetingAdvanceSearch from './components/MeetingAdvanceSearch';
import AddMeeting from './components/Addmeeting';
import CommonDeleteModel from 'components/commonDeleteModel';
import CommonCheckTable from '../../../components/reactTable/checktable';

const Index = () => {
    const title = "Meeting";
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [action, setAction] = useState(false);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [selectedValues, setSelectedValues] = useState([]);
    const [advanceSearch, setAdvanceSearch] = useState(false);
    const [getTagValuesOutSide, setGetTagValuesOutside] = useState([]);
    const [searchboxOutside, setSearchboxOutside] = useState('');
    const [deleteMany, setDeleteMany] = useState(false);
    const [isLoding, setIsLoding] = useState(false);
    const [data, setData] = useState([]);
    const [displaySearchData, setDisplaySearchData] = useState(false);
    const [searchedData, setSearchedData] = useState([]);
    const [permission] = HasAccess(['Meetings']);

    const actionHeader = {
        Header: "Action",
        isSortable: false,
        center: true,
        cell: ({ row }) => (
            <Text fontSize="md" fontWeight="900" textAlign={"center"}>
                <Menu isLazy>
                    <MenuButton><CiMenuKebab /></MenuButton>
                    <MenuList minW={'fit-content'} transform={"translate(1520px, 173px);"}>
                        {permission?.view && (
                            <MenuItem py={2.5} color={'green'}
                                onClick={() => navigate(`/meeting/${row?.values._id}`)}
                                icon={<ViewIcon fontSize={15} />}>
                                View
                            </MenuItem>
                        )}
                        {permission?.delete && (
                            <MenuItem py={2.5} color={'red'}
                                onClick={() => { setDeleteMany(true); setSelectedValues([row?.values?._id]); }}
                                icon={<DeleteIcon fontSize={15} />}>
                                Delete
                            </MenuItem>
                        )}
                    </MenuList>
                </Menu>
            </Text>
        )
    };

    const tableColumns = [
        {
            Header: "#",
            accessor: "_id",
            isSortable: false,
            width: 10
        },
        {
            Header: 'Agenda',
            accessor: 'agenda',
            cell: (cell) => (
                <Link to={`/meeting/${cell?.row?.values._id}`}>
                    <Text me="10px" sx={{ '&:hover': { color: 'blue.500', textDecoration: 'underline' } }}
                        color='brand.600' fontSize="sm" fontWeight="700">
                        {cell?.value || ' - '}
                    </Text>
                </Link>
            )
        },
        { Header: "Date & Time", accessor: "dateTime" },
        { Header: "Time Stamp", accessor: "timestamp" },
        { Header: "Created By", accessor: "createdByName" },
        ...(permission?.update || permission?.view || permission?.delete ? [actionHeader] : [])
    ];

    const fetchData = async () => {
        setIsLoding(true);
        const result = await dispatch(fetchMeetingData());
        if (result.payload.status === 200) {
            setData(result?.payload?.data);
        } else {
            toast.error("Failed to fetch data");
        }
        setIsLoding(false);
    };

    const handleDeleteMeeting = async (ids) => {
        try {
            setIsLoding(true);
            const response = await deleteManyApi('api/meeting/deleteMany', ids);
            if (response.status === 200) {
                setSelectedValues([]);
                setDeleteMany(false);
                setAction(prev => !prev);
                toast.success("Meetings deleted successfully");
            }
        } catch (error) {
            toast.error("Error deleting meetings");
        } finally {
            setIsLoding(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [action]);

    return (
        <div>
            <CommonCheckTable
                title={title}
                isLoding={isLoding}
                columnData={tableColumns}
                allData={data}
                tableData={data}
                searchDisplay={displaySearchData}
                setSearchDisplay={setDisplaySearchData}
                searchedDataOut={searchedData}
                setSearchedDataOut={setSearchedData}
                access={permission}
                onOpen={onOpen}
                selectedValues={selectedValues}
                setSelectedValues={setSelectedValues}
                setDelete={setDeleteMany}
                AdvanceSearch={
                    <Button variant="outline" colorScheme='brand' leftIcon={<SearchIcon />}
                        mt={{ sm: "5px", md: "0" }} size="sm"
                        onClick={() => setAdvanceSearch(true)}>
                        Advance Search
                    </Button>
                }
                getTagValuesOutSide={getTagValuesOutSide}
                searchboxOutside={searchboxOutside}
                setGetTagValuesOutside={setGetTagValuesOutside}
                setSearchboxOutside={setSearchboxOutside}
                handleSearchType="MeetingSearch"
            />

            <MeetingAdvanceSearch
                advanceSearch={advanceSearch}
                setAdvanceSearch={setAdvanceSearch}
                setSearchedData={setSearchedData}
                setDisplaySearchData={setDisplaySearchData}
                allData={data}
                setAction={setAction}
                setGetTagValues={setGetTagValuesOutside}
                setSearchbox={setSearchboxOutside}
            />

            <AddMeeting setAction={setAction} isOpen={isOpen} onClose={onClose} />

            <CommonDeleteModel
                isOpen={deleteMany}
                onClose={() => setDeleteMany(false)}
                type='Meetings'
                handleDeleteData={handleDeleteMeeting}
                ids={selectedValues}
            />
        </div>
    );
};

export default Index;
